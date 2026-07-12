const STORAGE_KEY = 'cm_text_reviews_v2';
const LEGACY_STORAGE_KEY = 'cm_text_reviews_v1';
const OWNERSHIP_KEY = 'cm_review_ownership';
const REPORT_KEY = 'cm_review_reports';
const MAX_REVIEWS_PER_TOOL = 100;

function safeParse(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

function normalizeText(value, maxLength) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function nowIso() { return new Date().toISOString(); }
function createId() { return `review_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`; }

export class ReviewService {
  constructor({ mode = 'local' } = {}) {
    this.mode = mode;
    this._migrateLegacy();
  }

  _readAll() { return safeParse(localStorage.getItem(STORAGE_KEY), {}); }
  _writeAll(value) { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); }

  _migrateLegacy() {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const legacy = safeParse(localStorage.getItem(LEGACY_STORAGE_KEY), null);
    if (legacy && typeof legacy === 'object') this._writeAll(legacy);
  }

  list(toolId, { sort = 'newest', rating = 0, useCase = 'all' } = {}) {
    if (!toolId) return [];
    const all = this._readAll();
    let rows = Array.isArray(all[toolId]) ? all[toolId] : [];
    rows = rows.filter(row => row && row.status !== 'deleted');
    if (Number(rating) > 0) rows = rows.filter(row => Number(row.rating) === Number(rating));
    if (useCase !== 'all') rows = rows.filter(row => row.useCase === useCase);
    const sorters = {
      oldest: (a,b) => String(a.createdAt).localeCompare(String(b.createdAt)),
      rating: (a,b) => Number(b.rating)-Number(a.rating) || String(b.createdAt).localeCompare(String(a.createdAt)),
      helpful: (a,b) => Number(b.helpfulCount||0)-Number(a.helpfulCount||0) || String(b.createdAt).localeCompare(String(a.createdAt)),
      newest: (a,b) => String(b.createdAt).localeCompare(String(a.createdAt))
    };
    return [...rows].sort(sorters[sort] || sorters.newest);
  }

  create(toolId, input) {
    if (!toolId) throw new Error('도구 정보가 없습니다.');
    const rating = Number(input.rating);
    const content = normalizeText(input.content, 500);
    const nickname = normalizeText(input.nickname || '익명 사용자', 30) || '익명 사용자';
    const useCase = normalizeText(input.useCase || 'general', 40);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('별점을 1~5점에서 선택해 주세요.');
    if (content.length < 10) throw new Error('후기를 10자 이상 작성해 주세요.');
    const all = this._readAll();
    const rows = Array.isArray(all[toolId]) ? all[toolId] : [];
    const review = { id:createId(), toolId, rating, nickname, useCase, content, helpfulCount:0, createdAt:nowIso(), updatedAt:null, status:'approved-local', ownerToken:createId() };
    all[toolId] = [review, ...rows].slice(0, MAX_REVIEWS_PER_TOOL);
    this._writeAll(all);
    this._rememberOwnership(review.id, review.ownerToken);
    return review;
  }

  updateOwn(toolId, reviewId, input) {
    const all=this._readAll();
    const rows=Array.isArray(all[toolId])?all[toolId]:[];
    const row=rows.find(item=>item.id===reviewId);
    if(!row || !this.isOwned(row)) throw new Error('수정할 수 있는 후기가 아닙니다.');
    const rating=Number(input.rating); const content=normalizeText(input.content,500);
    if(!Number.isInteger(rating)||rating<1||rating>5) throw new Error('별점을 선택해 주세요.');
    if(content.length<10) throw new Error('후기를 10자 이상 작성해 주세요.');
    row.rating=rating; row.content=content; row.nickname=normalizeText(input.nickname||'익명 사용자',30)||'익명 사용자'; row.useCase=normalizeText(input.useCase||'general',40); row.updatedAt=nowIso();
    this._writeAll(all); return row;
  }

  markHelpful(toolId, reviewId) {
    const votedKey = `cm_review_helpful_${reviewId}`;
    if (localStorage.getItem(votedKey)) return false;
    const all=this._readAll(); const rows=Array.isArray(all[toolId])?all[toolId]:[]; const row=rows.find(item=>item.id===reviewId);
    if(!row)return false; row.helpfulCount=Math.max(0,Number(row.helpfulCount)||0)+1; this._writeAll(all); localStorage.setItem(votedKey,'1'); return true;
  }

  report(toolId, reviewId, reason='inappropriate') {
    const key=`${toolId}:${reviewId}`; const reports=safeParse(localStorage.getItem(REPORT_KEY),{});
    if(reports[key]) return false; reports[key]={toolId,reviewId,reason,createdAt:nowIso()}; localStorage.setItem(REPORT_KEY,JSON.stringify(reports)); return true;
  }

  deleteOwn(toolId, reviewId) {
    const all=this._readAll(); const rows=Array.isArray(all[toolId])?all[toolId]:[]; const row=rows.find(item=>item.id===reviewId);
    if(!row||!this.isOwned(row))return false; all[toolId]=rows.filter(item=>item.id!==reviewId); this._writeAll(all); return true;
  }

  isOwned(review) { const ownership=safeParse(localStorage.getItem(OWNERSHIP_KEY),{}); return Boolean(review?.id&&review?.ownerToken&&ownership[review.id]===review.ownerToken); }

  summary(toolId) {
    const rows=this.list(toolId); const count=rows.length; const distribution={1:0,2:0,3:0,4:0,5:0};
    for(const row of rows) distribution[Math.max(1,Math.min(5,Number(row.rating)||1))]++;
    const average=count?rows.reduce((sum,row)=>sum+Number(row.rating||0),0)/count:0;
    return {count,average,distribution};
  }

  _rememberOwnership(id,token){const ownership=safeParse(localStorage.getItem(OWNERSHIP_KEY),{});ownership[id]=token;localStorage.setItem(OWNERSHIP_KEY,JSON.stringify(ownership));}
}
export const reviewService = new ReviewService({ mode: 'local' });

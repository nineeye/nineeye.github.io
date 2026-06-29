export default class PluginManager {



constructor(){


this.plugins={};



}



register(
name,
plugin
){


this.plugins[name]=plugin;



}



get(name){



return this.plugins[name];



}



list(){


return Object.keys(

this.plugins

);



}



}

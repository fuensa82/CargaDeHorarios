// Includes
var fs = require("fs");
var _ = require("underscore");
var XmlReader = require('xml-reader');
var convert = require('xml-js');


//Rutas de los fichero
var fileHorarios = 'c:\\pruebas\\horarios2.xml';
var xmlAux=fs.readFileSync(fileHorarios,'utf8');

var result1 = convert.xml2js(xmlAux, {compact: true, spaces: 4});
//objeto profesores: result1.timetable.teachers.teacher[x]
console.log("Transformado");
var profesores=new Array();
for (var i=0;i<result1.timetable.teachers.teacher.length;i++){
    guardarProfesor(result1.timetable.teachers.teacher[i],profesores);

}
console.log("tratado");




function guardarProfesor(profesor,profesores){
    profesores[profesor._attributes.id]={
        nombreCorto:profesor._attributes.short,
        nombre:profesor._attributes.name
    };
}


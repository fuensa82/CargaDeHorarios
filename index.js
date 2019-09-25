// Includes
var fs = require("fs");
var _ = require("underscore");
var jsonfile = require('jsonfile');
var xmlQuery = require('xml-query');
var XmlReader = require('xml-reader');

//Rutas de los fichero
var fileHorarios = 'FacturasProcesadas/facturas.json';

//Array para ficheros
var arrayFacturas=new Array();

//comenzamos
//Inicializacion de variables
var listaFacturasProcesadas=jsonfile.readFileSync(fileFacturasProcesadas);
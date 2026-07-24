/**
 * Barrel de utilitários.
 * Mantido para compatibilidade com os imports antigos
 * (`require("../utils/utils")`).
 *
 * Em código novo, prefira importar o módulo específico:
 * utils/file, utils/object, utils/time, utils/args.
 */

const file = require("./file");
const object = require("./object");
const time = require("./time");
const args = require("./args");

module.exports = {
	...file,
	...object,
	...time,
	parseArgs: args.parse,
};
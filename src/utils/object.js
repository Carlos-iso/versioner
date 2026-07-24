/**
 * Define um valor em um caminho aninhado.
 * Exemplo: setValue(json, "expo.version", "1.0.0")
 */
function setValue(object, path, value) {
	const keys = String(path).split(".");

	let current = object;

	while (keys.length > 1) {
		const key = keys.shift();

		if (typeof current[key] !== "object" || current[key] === null) {
			current[key] = {};
		}

		current = current[key];
	}

	current[keys[0]] = value;

	return object;
}

/**
 * Lê um valor em um caminho aninhado.
 * Retorna `undefined` se o caminho não existir.
 */
function getValue(object, path) {
	const keys = String(path).split(".");

	let current = object;

	for (const key of keys) {
		if (typeof current !== "object" || current === null) {
			return undefined;
		}

		current = current[key];
	}

	return current;
}

/**
 * Merge raso-profundo usado para aplicar os defaults da configuração.
 * Valores do `source` sobrescrevem os do `target`.
 */
function merge(target, source) {
	const result = { ...target };

	for (const key of Object.keys(source || {})) {
		const value = source[key];

		if (value === undefined) {
			continue;
		}

		if (isPlainObject(value) && isPlainObject(result[key])) {
			result[key] = merge(result[key], value);
			continue;
		}

		result[key] = value;
	}

	return result;
}

function isPlainObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

module.exports = {
	setValue,
	getValue,
	merge,
	isPlainObject,
};
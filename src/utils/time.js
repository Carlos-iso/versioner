/**
 * Formata uma duração em milissegundos de forma legível.
 * A unidade já vem embutida no retorno.
 */
function formatDuration(milliseconds) {
	const ms = Math.max(0, Number(milliseconds) || 0);

	if (ms < 1000) {
		return `${Math.round(ms)} ms`;
	}

	const seconds = ms / 1000;

	if (seconds < 60) {
		return `${seconds.toFixed(2)} s`;
	}

	const minutes = Math.floor(seconds / 60);
	const remaining = (seconds % 60).toFixed(2);

	return `${minutes} min ${remaining} s`;
}

/**
 * Data legível para CHANGELOG / logs.
 */
function formatDate(date) {
	const value = date instanceof Date ? date : new Date(date);

	return value.toISOString().slice(0, 10);
}

module.exports = {
	formatDuration,
	formatDate,
};
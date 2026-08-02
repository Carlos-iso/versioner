/**
 * Objeto compartilhado por toda a execução.
 *
 * Regra da arquitetura: nenhum Manager conhece outro Manager.
 * Todos leem e escrevem apenas no Context.
 */
function createContext({ type, message = "", cwd = process.cwd(), flags = {} } = {}) {
	return {
		// Argumentos da CLI
		type,
		message,
		flags,

		// Diretório onde a ferramenta foi executada
		cwd,

		// Configuração do projeto (versioner.config.json)
		config: null,

		// Versão anterior (string)
		previousVersion: null,

		// Versão atual (string)
		version: null,

		// Objeto da versão anterior
		previous: {
			major: null,
			minor: null,
			build: null,
		},

		// Objeto da versão atual
		current: {
			major: null,
			minor: null,
			build: null,
		},

		// Arquivos atualizados durante a release
		files: [],

		// Arquivos configurados que não foram encontrados
		skipped: [],

		// Informações do Git
		git: {
			add: false,
			commit: false,
			push: false,
			tag: false,
			tagName: null,
			branch: null,

			// Estado anterior à etapa do Git, guardado para permitir o rollback.
			// headBefore: commit em que HEAD estava (null em repositório sem commits).
			// indexBefore: árvore do índice antes do "git add".
			headBefore: null,
			indexBefore: null,
		},

		// Modo simulação
		dryRun: false,

		// Controle de execução
		startedAt: new Date(),
		finishedAt: null,
	};
}

module.exports = { createContext };
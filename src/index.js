const ReleaseManager = require("./ReleaseManager");

const args = process.argv.slice(2);

const context = {

    // Argumentos da CLI
    type: args[0],
    message: args.slice(1).join(" "),

    // Diretório onde a ferramenta foi executada
    cwd: process.cwd(),

    // Configuração do projeto
    config: null,

    // Versão anterior (string)
    previousVersion: null,

    // Versão atual (string)
    version: null,

    // Objeto da versão anterior
    previous: {
        major: null,
        minor: null,
        build: null
    },

    // Objeto da versão atual
    current: {
        major: null,
        minor: null,
        build: null
    },

    // Arquivos atualizados durante a release
    files: [],

    // Informações do Git
    git: {
        add: false,
        commit: false,
        push: false,
        tag: false
    },

    // Controle de execução
    startedAt: new Date(),
    finishedAt: null

};

const release = new ReleaseManager();

release.run(context);
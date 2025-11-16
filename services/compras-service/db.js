const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', // Usuário padrão do PostgreSQL
  host: 'localhost', // Como o serviço roda na sua máquina, ele acessa o Docker via localhost
  database: 'erp-padaria-db', // Banco de dados padrão criado com a imagem do PostgreSQL
  password: '(Kaio@3522#)', // A senha que você definiu no comando 'docker run'
  port: 5432, // Porta padrão do PostgreSQL
});

module.exports = pool;
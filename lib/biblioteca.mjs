// Taxonomia aprovada no quadro de referencia do cliente.
// Visibilidade conservadora por padrao (nao implica concessao de acesso).
export const bibliotecaCategorias = Object.freeze([
  { id: 'perspectivas-internas', grupo: 'Perspectivas', nome: 'Internas', acesso: 'corretor' },
  { id: 'perspectivas-externas', grupo: 'Perspectivas', nome: 'Externas', acesso: 'corretor' },
  { id: 'plantas', grupo: 'Perspectivas', nome: 'Plantas', acesso: 'corretor' },
  { id: 'cnpj', grupo: 'Dados do empreendimento', nome: 'CNPJ', acesso: 'interno' },
  { id: 'pix', grupo: 'Dados do empreendimento', nome: 'PIX', acesso: 'interno' },
  { id: 'book-corretores', grupo: 'Comercial', nome: 'Book dos corretores', acesso: 'corretor' },
  { id: 'videos', grupo: 'Audiovisual', nome: 'Vídeos do empreendimento', acesso: 'corretor' },
  { id: 'localizacao', grupo: 'Audiovisual', nome: 'Localização', acesso: 'corretor' },
  { id: 'apresentacao', grupo: 'Audiovisual', nome: 'Apresentação', acesso: 'corretor' },
  { id: 'logomarca', grupo: 'Identidade', nome: 'Logomarca', acesso: 'corretor' },
  { id: 'projeto-arquitetonico', grupo: 'Projetos', nome: 'Projeto arquitetônico', acesso: 'interno' },
  { id: 'estacionamento', grupo: 'Projetos', nome: 'Vagas de estacionamento', acesso: 'corretor' },
  { id: 'postagens', grupo: 'Redes sociais', nome: 'Postagens de janeiro a dezembro', acesso: 'interno' },
  { id: 'simulador', grupo: 'Comercial', nome: 'Simulador de entrada', acesso: 'corretor' },
  { id: 'tabela-precos', grupo: 'Comercial', nome: 'Tabela de preços', acesso: 'interno' },
  { id: 'memorial', grupo: 'Documentação', nome: 'Memorial descritivo', acesso: 'corretor' },
]);

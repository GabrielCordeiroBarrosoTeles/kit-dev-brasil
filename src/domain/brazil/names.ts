import type { AtLeastTwo, NonEmpty } from '../shared/random';

export const FEMALE_NAMES: NonEmpty<string> = [
  'Ana', 'Maria', 'Juliana', 'Fernanda', 'Camila', 'Beatriz', 'Larissa', 'Gabriela', 'Mariana', 'Letícia',
  'Amanda', 'Bruna', 'Carolina', 'Patrícia', 'Aline', 'Vanessa', 'Isabela', 'Luana', 'Natália', 'Rafaela',
  'Helena', 'Alice', 'Laura', 'Manuela', 'Valentina', 'Sophia', 'Lívia', 'Giovanna', 'Cecília', 'Clara',
];

export const MALE_NAMES: NonEmpty<string> = [
  'João', 'José', 'Pedro', 'Lucas', 'Gabriel', 'Mateus', 'Rafael', 'Gustavo', 'Felipe', 'Bruno',
  'Thiago', 'Rodrigo', 'Diego', 'Leonardo', 'Daniel', 'André', 'Carlos', 'Eduardo', 'Marcelo', 'Vinícius',
  'Miguel', 'Arthur', 'Heitor', 'Bernardo', 'Davi', 'Samuel', 'Enzo', 'Lorenzo', 'Caio', 'Henrique',
];

export const SURNAMES: AtLeastTwo<string> = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
  'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa',
  'Rocha', 'Dias', 'Nascimento', 'Andrade', 'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas',
  'Cardoso', 'Ramos', 'Gonçalves', 'Santana', 'Teixeira', 'Araújo', 'Pinto', 'Moura', 'Cavalcanti', 'Monteiro',
];

export const STREET_TYPES: NonEmpty<string> = ['Rua', 'Avenida', 'Travessa', 'Alameda', 'Praça'];

export const STREET_NAMES: NonEmpty<string> = [
  'das Flores', 'Brasil', 'São João', 'Sete de Setembro', 'Quinze de Novembro', 'Tiradentes', 'Santos Dumont',
  'Dom Pedro II', 'Getúlio Vargas', 'Rui Barbosa', 'José Bonifácio', 'das Palmeiras', 'Marechal Deodoro',
  'Castro Alves', 'Machado de Assis', 'Carlos Gomes', 'Monteiro Lobato', 'dos Ipês', 'das Acácias', 'Joaquim Nabuco',
];

export const NEIGHBORHOODS: NonEmpty<string> = [
  'Centro', 'Jardim América', 'Vila Nova', 'Boa Vista', 'Santa Cecília', 'Bela Vista', 'São José', 'Liberdade',
  'Jardim das Flores', 'Planalto', 'Cidade Nova', 'Parque das Árvores', 'Industrial', 'Alto da Boa Vista', 'Vila Mariana',
];

export const COMPANY_ACTIVITIES: NonEmpty<string> = [
  'Comércio', 'Serviços', 'Tecnologia', 'Distribuidora', 'Construtora', 'Consultoria', 'Alimentos',
  'Transportes', 'Logística', 'Engenharia', 'Informática', 'Indústria', 'Marketing', 'Saúde', 'Educação',
];

export const COMPANY_SUFFIXES: NonEmpty<string> = ['LTDA', 'S.A.', 'ME', 'EPP'];

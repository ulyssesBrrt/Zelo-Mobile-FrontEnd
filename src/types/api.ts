export interface ApiAlarme { id: number; hora: string; ativo: boolean; adiarMinutos: number }

export interface ApiMedicamento {
    id: number; nome: string; dosagem: string; formato: string;
    viaAdministracao: string | null; quantidadeEstoque: number; ativo: boolean;
    alarmes?: ApiAlarme[];
}

export interface ApiUsuario {
    id: number; nome: string; email: string; tipoUsuario: string;
    dataNascimento: string | null; telefone: string | null; fotoUrl: string | null;
    tipoSanguineo: string | null; alergias: string | null;
    condicaoSaude: string | null; observacoesImportantes: string | null;
}

export interface ApiNotificacao { id: number; titulo: string; descricao: string | null; dataHora: string; tipo: string; lida: boolean }

export type ApiStatusDose = 'TOMADO' | 'IGNORADO' | 'PENDENTE';

export interface ApiHistoricoItem { medicamento: string; dosagem: string; horario: string; status: ApiStatusDose }

export interface ApiResumoDia { data: string; tomados: number; pendentes: number; itens: ApiHistoricoItem[] }

export interface ApiResumoPeriodo { data: string; tomados: number; pendaentes: number }

export interface ApiContato { id: number; nome: string; telefone: string; parentesco: string | null }

export interface ApiContatoSos { nome: string; telefone: string; parentesco: string | null; principal: boolean }
export type FunnelType = "vendas" | "festa" | "executadas";
export type EventType = "festa" | "visita";

export type SalesStage = "contato_inicial" | "proposta_enviada" | "negociacao" | "visita_agendada" | "fechado" | "perdido";
export type PartyStage = "boas_vindas" | "planejamento" | "contrato" | "organizacao" | "festa_pronta";
export type ExecutedStage = "aguardando_feedback" | "redes_sociais" | "oportunidade_futura";

export type Stage = SalesStage | PartyStage | ExecutedStage;

export interface Payment {
  id: string;
  date: string;
  amount: number;
}

export interface Event {
  id: string;
  clientName: string;
  birthdayChildName: string;
  birthDate: string;
  phone: string;
  partyDate: string;
  partyTime: string;
  selectedPackage: string;
  packageValue: number;
  addonsValue: number;
  totalValue: number;
  downPayment: number;
  payments: Payment[];
  guestCount: number;
  funnel: FunnelType;
  stage: Stage;
  status: string;
  eventType: EventType;
  createdAt: string;
  updatedAt: string;
}

export const salesStages: { key: SalesStage; label: string }[] = [
  { key: "contato_inicial", label: "Contato Inicial" },
  { key: "proposta_enviada", label: "Proposta Enviada" },
  { key: "negociacao", label: "Negociação" },
  { key: "visita_agendada", label: "Visita Agendada" },
  { key: "fechado", label: "Fechado" },
  { key: "perdido", label: "Perdido" },
];

export const partyStages: { key: PartyStage; label: string }[] = [
  { key: "boas_vindas", label: "Boas Vindas" },
  { key: "planejamento", label: "Planejamento" },
  { key: "contrato", label: "Contrato" },
  { key: "organizacao", label: "Organização" },
  { key: "festa_pronta", label: "Festa Pronta" },
];

export const executedStages: { key: ExecutedStage; label: string }[] = [
  { key: "aguardando_feedback", label: "Aguardando Feedback" },
  { key: "redes_sociais", label: "Redes Sociais" },
  { key: "oportunidade_futura", label: "Oportunidade Futura" },
];

export const mockEvents: Event[] = [
  { id: "1", clientName: "Ana Silva", birthdayChildName: "Sophia", birthDate: "2020-06-15", phone: "(11) 99999-1111", partyDate: "2026-04-19", partyTime: "15:00", selectedPackage: "Pacote Ouro", packageValue: 3000, addonsValue: 500, totalValue: 3500, downPayment: 1000, payments: [{ id: "p1", date: "2026-04-01", amount: 1000 }], guestCount: 35, funnel: "vendas", stage: "negociacao", status: "ativo", eventType: "festa", createdAt: "2026-04-01", updatedAt: "2026-04-10" },
  { id: "2", clientName: "João Santos", birthdayChildName: "Miguel", birthDate: "2019-04-20", phone: "(11) 99999-2222", partyDate: "2026-04-22", partyTime: "14:00", selectedPackage: "Pacote Diamante", packageValue: 3500, addonsValue: 700, totalValue: 4200, downPayment: 1500, payments: [{ id: "p2", date: "2026-04-02", amount: 1500 }], guestCount: 50, funnel: "vendas", stage: "proposta_enviada", status: "ativo", eventType: "visita", createdAt: "2026-04-02", updatedAt: "2026-04-08" },
  { id: "3", clientName: "Maria Costa", birthdayChildName: "Helena", birthDate: "2021-05-10", phone: "(11) 99999-3333", partyDate: "2026-04-26", partyTime: "16:00", selectedPackage: "Pacote Prata", packageValue: 2500, addonsValue: 300, totalValue: 2800, downPayment: 800, payments: [{ id: "p3", date: "2026-03-15", amount: 800 }, { id: "p4", date: "2026-04-01", amount: 500 }], guestCount: 30, funnel: "festa", stage: "planejamento", status: "ativo", eventType: "festa", createdAt: "2026-03-15", updatedAt: "2026-04-05" },
  { id: "4", clientName: "Pedro Lima", birthdayChildName: "Arthur", birthDate: "2020-08-22", phone: "(11) 99999-4444", partyDate: "2026-04-28", partyTime: "10:00", selectedPackage: "Pacote Diamante", packageValue: 4200, addonsValue: 800, totalValue: 5000, downPayment: 2000, payments: [{ id: "p5", date: "2026-03-20", amount: 2000 }], guestCount: 60, funnel: "festa", stage: "contrato", status: "pendente", eventType: "festa", createdAt: "2026-03-20", updatedAt: "2026-04-12" },
  { id: "5", clientName: "Carla Oliveira", birthdayChildName: "Valentina", birthDate: "2021-07-03", phone: "(11) 99999-5555", partyDate: "2026-05-03", partyTime: "15:00", selectedPackage: "Pacote Ouro", packageValue: 3200, addonsValue: 700, totalValue: 3900, downPayment: 1200, payments: [], guestCount: 40, funnel: "vendas", stage: "contato_inicial", status: "novo", eventType: "visita", createdAt: "2026-04-14", updatedAt: "2026-04-14" },
  { id: "6", clientName: "Lucas Ferreira", birthdayChildName: "Theo", birthDate: "2019-12-01", phone: "(11) 99999-6666", partyDate: "2026-04-19", partyTime: "14:00", selectedPackage: "Pacote Premium", packageValue: 5000, addonsValue: 1200, totalValue: 6200, downPayment: 2500, payments: [{ id: "p6", date: "2026-04-03", amount: 2500 }, { id: "p7", date: "2026-04-10", amount: 1000 }], guestCount: 80, funnel: "vendas", stage: "visita_agendada", status: "ativo", eventType: "visita", createdAt: "2026-04-03", updatedAt: "2026-04-13" },
  { id: "7", clientName: "Fernanda Rocha", birthdayChildName: "Laura", birthDate: "2020-04-15", phone: "(11) 99999-7777", partyDate: "2026-04-15", partyTime: "16:00", selectedPackage: "Pacote Prata", packageValue: 2800, addonsValue: 400, totalValue: 3200, downPayment: 1000, payments: [{ id: "p8", date: "2026-03-01", amount: 1000 }, { id: "p9", date: "2026-03-20", amount: 1000 }, { id: "p10", date: "2026-04-10", amount: 1200 }], guestCount: 25, funnel: "executadas", stage: "aguardando_feedback", status: "finalizado", eventType: "festa", createdAt: "2026-03-01", updatedAt: "2026-04-15" },
  { id: "8", clientName: "Roberto Dias", birthdayChildName: "Gael", birthDate: "2019-10-08", phone: "(11) 99999-8888", partyDate: "2026-04-10", partyTime: "11:00", selectedPackage: "Pacote Diamante", packageValue: 3800, addonsValue: 700, totalValue: 4500, downPayment: 1500, payments: [{ id: "p11", date: "2026-02-20", amount: 1500 }, { id: "p12", date: "2026-03-15", amount: 1500 }, { id: "p13", date: "2026-04-05", amount: 1500 }], guestCount: 45, funnel: "executadas", stage: "redes_sociais", status: "finalizado", eventType: "festa", createdAt: "2026-02-20", updatedAt: "2026-04-11" },
  { id: "9", clientName: "Tatiana Alves", birthdayChildName: "Alice", birthDate: "2020-05-20", phone: "(11) 99999-9999", partyDate: "2026-05-15", partyTime: "15:00", selectedPackage: "Pacote Ouro", packageValue: 3200, addonsValue: 600, totalValue: 3800, downPayment: 1200, payments: [{ id: "p14", date: "2026-03-25", amount: 1200 }, { id: "p15", date: "2026-04-09", amount: 800 }], guestCount: 55, funnel: "vendas", stage: "fechado", status: "ativo", eventType: "festa", createdAt: "2026-03-25", updatedAt: "2026-04-09" },
  { id: "10", clientName: "Bruno Mendes", birthdayChildName: "Davi", birthDate: "2021-03-12", phone: "(11) 99999-0000", partyDate: "2026-05-20", partyTime: "14:00", selectedPackage: "Pacote Premium", packageValue: 4000, addonsValue: 800, totalValue: 4800, downPayment: 1800, payments: [{ id: "p16", date: "2026-04-10", amount: 1800 }], guestCount: 70, funnel: "festa", stage: "boas_vindas", status: "ativo", eventType: "festa", createdAt: "2026-04-10", updatedAt: "2026-04-14" },
  { id: "11", clientName: "Juliana Martins", birthdayChildName: "Manuela", birthDate: "2020-02-28", phone: "(11) 98888-1111", partyDate: "2026-04-05", partyTime: "10:00", selectedPackage: "Pacote Prata", packageValue: 2500, addonsValue: 400, totalValue: 2900, downPayment: 900, payments: [{ id: "p17", date: "2026-02-10", amount: 900 }, { id: "p18", date: "2026-03-10", amount: 1000 }, { id: "p19", date: "2026-04-01", amount: 1000 }], guestCount: 20, funnel: "executadas", stage: "oportunidade_futura", status: "finalizado", eventType: "festa", createdAt: "2026-02-10", updatedAt: "2026-04-06" },
  { id: "12", clientName: "Marcos Souza", birthdayChildName: "Bernardo", birthDate: "2019-07-14", phone: "(11) 98888-2222", partyDate: "2026-05-25", partyTime: "15:00", selectedPackage: "Pacote Premium", packageValue: 4500, addonsValue: 1000, totalValue: 5500, downPayment: 2000, payments: [{ id: "p20", date: "2026-04-05", amount: 2000 }], guestCount: 65, funnel: "vendas", stage: "negociacao", status: "ativo", eventType: "festa", createdAt: "2026-04-05", updatedAt: "2026-04-13" },
  { id: "13", clientName: "Patrícia Nunes", birthdayChildName: "Cecília", birthDate: "2021-01-25", phone: "(11) 98888-3333", partyDate: "2026-05-08", partyTime: "16:00", selectedPackage: "Pacote Ouro", packageValue: 2600, addonsValue: 500, totalValue: 3100, downPayment: 1000, payments: [{ id: "p21", date: "2026-03-10", amount: 1000 }, { id: "p22", date: "2026-04-05", amount: 600 }], guestCount: 35, funnel: "festa", stage: "organizacao", status: "ativo", eventType: "festa", createdAt: "2026-03-10", updatedAt: "2026-04-12" },
  { id: "14", clientName: "Ricardo Gomes", birthdayChildName: "Lorenzo", birthDate: "2020-11-30", phone: "(11) 98888-4444", partyDate: "2026-04-30", partyTime: "14:00", selectedPackage: "Pacote Diamante", packageValue: 3500, addonsValue: 500, totalValue: 4000, downPayment: 1500, payments: [{ id: "p23", date: "2026-03-05", amount: 1500 }, { id: "p24", date: "2026-04-01", amount: 1000 }, { id: "p25", date: "2026-04-14", amount: 800 }], guestCount: 50, funnel: "festa", stage: "festa_pronta", status: "ativo", eventType: "festa", createdAt: "2026-03-05", updatedAt: "2026-04-14" },
];

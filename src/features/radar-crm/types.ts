import {
  CRM_PRIORITIES,
  CRM_STATUSES,
  INTERACTION_TYPES,
} from "./constants";

export type CrmStatus = (typeof CRM_STATUSES)[number];
export type CrmPriority = (typeof CRM_PRIORITIES)[number];
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export interface RadarDecisionMaker {
  id: number;
  name: string;
  qualification: string | null;
  is_administrator: boolean;
  is_probable_decision_maker: boolean;
  decision_priority: number | null;
}

export interface RadarCompanyListItem {
  id: number;
  name: string;
  legal_name: string | null;
  trade_name: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  phone_unformatted: string | null;
  whatsapp: string | null;
  has_whatsapp: boolean;
  website: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
  email: string | null;
  rating: number | null;
  reviews_count: number | null;
  google_maps_url: string | null;
  cnpj: string | null;
  cnpj_formatted: string | null;
  cnpj_validated: boolean;
  cnpj_validation_status: string | null;
  cnpj_registration_status: string | null;
  has_instagram: boolean;
  has_phone: boolean;
  has_website: boolean;
  has_administrator: boolean;
  partners_count: number;
  administrators_count: number;
  primary_decision_maker: RadarDecisionMaker | null;
  status: CrmStatus;
  priority: CrmPriority;
  assigned_user_id: string | null;
  assigned_user_name: string | null;
  assigned_user_email: string | null;
  last_contact_at: string | null;
  next_action_at: string | null;
  next_action_description: string | null;
  do_not_contact: boolean;
  lost_reason: string | null;
  notes?: string | null;
  crm_created_at?: string | null;
  last_interaction?: {
    id: number;
    interaction_type: InteractionType;
    interaction_at: string;
    notes: string | null;
  } | null;
  next_action_overdue: boolean;
}

export interface RadarCompanyListResult {
  total: number;
  filtered: number;
  page: number;
  page_size: number;
  items: RadarCompanyListItem[];
}

export interface RadarCrmFilters {
  search: string;
  statuses: CrmStatus[];
  priorities: CrmPriority[];
  city: string;
  state: string;
  category: string;
  hasInstagram: boolean | null;
  hasPhone: boolean | null;
  hasWhatsapp: boolean | null;
  hasWebsite: boolean | null;
  cnpjValidated: boolean | null;
  registrationActive: boolean | null;
  hasAdministrator: boolean | null;
  assignedUserId: string;
  nextActionFrom: string;
  nextActionTo: string;
  withoutContact: boolean;
  overdueNextAction: boolean;
  page: number;
  pageSize: number;
}

export interface RadarFilterAssignee {
  id: string;
  full_name: string | null;
  email: string | null;
}

export interface RadarFilterOptions {
  cities: string[];
  states: string[];
  categories: string[];
  assignees: RadarFilterAssignee[];
}

export interface RadarCompanyContact {
  id: number;
  contact_type: string;
  display_value: string | null;
  normalized_value: string;
  is_whatsapp: boolean;
  likely_whatsapp: boolean;
  is_primary: boolean;
}

export interface RadarCompanyPartner {
  id: number;
  partner_name: string;
  qualification: string | null;
  is_administrator: boolean;
  is_probable_decision_maker: boolean;
  decision_priority: number | null;
  age_range: string | null;
  joined_at: string | null;
  partner_document_masked: string | null;
  source: string;
}

export interface RadarValidatedCnpj {
  id: number;
  cnpj: string;
  cnpj_formatted: string | null;
  legal_name: string | null;
  trade_name: string | null;
  registration_status: string | null;
  registration_status_normalized: string | null;
  is_active: boolean | null;
  opening_date: string | null;
  legal_nature: string | null;
  company_size: string | null;
  mei_option: string | null;
  main_cnae_code: string | null;
  main_cnae_description: string | null;
  secondary_cnaes: Array<{ code?: string; description?: string }> | null;
  city: string | null;
  state: string | null;
  full_address: string | null;
  is_selected: boolean;
  is_validated: boolean;
  validation_status: string | null;
}

export interface RadarCompanyCrmState {
  id: number;
  company_id: number;
  status: CrmStatus;
  assigned_user_id: string | null;
  priority: CrmPriority;
  last_contact_at: string | null;
  next_action_at: string | null;
  next_action_description: string | null;
  lost_reason: string | null;
  do_not_contact: boolean;
  created_at: string;
  updated_at: string;
}

export interface RadarCompanyInteraction {
  id: number;
  interaction_type: InteractionType;
  interaction_at: string;
  notes: string | null;
  outcome: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_by_email: string | null;
  created_at: string;
}

export interface RadarCompanyDetailCompany {
  id: number;
  name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  phone_unformatted: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
  google_maps_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
  email: string | null;
  whatsapp: string | null;
  cnpj: string | null;
  cnpj_formatted: string | null;
  legal_name: string | null;
  trade_name: string | null;
  cnpj_validation_status: string | null;
}

export interface RadarCompanyDetail {
  company: RadarCompanyDetailCompany;
  crm: RadarCompanyCrmState | null;
  assigned_user: RadarFilterAssignee | null;
  validated_cnpj: RadarValidatedCnpj | null;
  partners: RadarCompanyPartner[];
  contacts: RadarCompanyContact[];
  interactions: RadarCompanyInteraction[];
}

export interface UpsertCrmPayload {
  companyId: number;
  status?: CrmStatus;
  priority?: CrmPriority;
  assignedUserId?: string | null;
  clearAssignedUser?: boolean;
  nextActionAt?: string | null;
  clearNextAction?: boolean;
  nextActionDescription?: string | null;
  lostReason?: string | null;
  doNotContact?: boolean;
  lastContactAt?: string | null;
  notes?: string | null;
}

export interface RadarKanbanFilters {
  search: string;
  priorities: CrmPriority[];
  city: string;
  state: string;
  category: string;
  hasInstagram: boolean | null;
  hasPhone: boolean | null;
  hasWhatsapp: boolean | null;
  hasAdministrator: boolean | null;
  assignedUserId: string;
  overdueNextAction: boolean;
  nextActionToday: boolean;
  nextActionWeek: boolean;
  withoutNextAction: boolean;
  withoutContact: boolean;
  doNotContact: boolean | null;
}

export interface RadarKanbanBoardResult {
  total: number;
  filtered: number;
  counts: Record<CrmStatus, number>;
  items: RadarCompanyListItem[];
}

export interface AddInteractionPayload {
  companyId: number;
  interactionType: InteractionType;
  notes?: string | null;
  outcome?: string | null;
  interactionAt?: string | null;
  status?: CrmStatus;
  nextActionAt?: string | null;
  nextActionDescription?: string | null;
  clearNextAction?: boolean;
  priority?: CrmPriority;
}

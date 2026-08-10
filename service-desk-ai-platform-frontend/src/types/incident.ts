export interface Incident {
  id: string;
  sysId: string;
  number: string;
  title: string;
  description: string;
  callerEmail: string;
  department: string;
  category: string;
  subcategory: string;
  priority: string;
  state: string;
  resolutionNotes: string;
  assignedGroup: string;
  sysCreatedOn: string;
  sysUpdatedOn: string;
}

export interface CreateIncidentRequest {
  title: string;
  description: string;
  callerEmail?: string;
  department?: string;
  category?: string;
  subcategory?: string;
  priority?: string;
  assignedGroup?: string;
}

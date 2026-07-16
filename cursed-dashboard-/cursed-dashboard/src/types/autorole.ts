export interface AutoroleConfig {
  autoroleId: string | null;
  autoroleRoleName: string | null;
}

export interface AutoroleRole {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
}

export interface CurrentAutoroleRole extends AutoroleRole {
  assignable: boolean;
  unavailableReason: string | null;
}

export const DEFAULT_AUTOROLE_CONFIG: AutoroleConfig = {
  autoroleId: null,
  autoroleRoleName: null,
};

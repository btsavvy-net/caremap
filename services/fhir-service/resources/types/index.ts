import { Patient } from './Patient';
import { Bundle } from './Bundle';

export { Patient, Bundle };

export type ResourceTypeMap = {
    Patient: Patient;
    Bundle: Bundle;
};

export type ResourceType = keyof ResourceTypeMap;

export const resourceList: readonly ResourceType[] = [
    'Patient',
    'Bundle'
];

import { editDirectory, isValidManagementName } from '@/services/management-actions'

export const isValidDirName = isValidManagementName
export const onRenameDir = (path: string) => editDirectory(path, 'rename')
export const onDeleteDir = (path: string) => editDirectory(path, 'delete')

import React from 'react';
import { DataExporter } from '@/components/admin/DataExporter';

export const metadata = {
  title: 'Exportar Datos | TecniFix Administración',
  description: 'Exportación masiva de tickets de servicio a formato CSV compatible con Excel.',
};

export default function AdminExportPage() {
  return <DataExporter />;
}

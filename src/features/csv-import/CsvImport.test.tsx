import { render, screen } from '@testing-library/react'
import i18n from 'i18next'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import CsvImport from './CsvImport'

const enCsvImport = {
  title: 'CSV Data Setup Coordinator',
  subtitle: 'Paste CSV data or upload files, then click Process to load into the workspace.',
  rooms: { label: 'Rooms List (CSV format)', uploadFile: 'Upload .csv file', count: '{{count}} Rooms' },
  registrants: {
    label: 'Registrants & Signups (CSV format)',
    uploadFile: 'Upload .csv file',
    count: '{{count}} Registrants'
  },
  processButton: 'Process and Load Lists',
  columnGuide: {
    title: 'CSV Column Format & Mapping Guidelines',
    bedRulesTitle: 'Room Bed Configuration Rules:',
    registrantColumnsTitle: 'Registrant Columns:',
    registrantColumnsDetail:
      'Need <code>Name</code>. Preferred bed maps to a bed configuration; preferred room matches the Room Type (e.g., <code>Standard</code>).'
  },
  success: 'Successfully loaded {{rooms}} Rooms and {{participants}} Participants to the allocation board!',
  errors: {
    roomsMinRows: 'Rooms CSV must have at least a header and one row of data.',
    roomsMissingRoomColumn: "Rooms CSV requires a column named 'Room' or 'Room ID'.",
    roomsMissingBedColumn: "Rooms CSV requires a column named 'Bed Configuration' or 'Beds'.",
    participantsMinRows: 'Participants CSV must have at least a header and one row of data.',
    participantsMissingNameColumn: "Participants CSV requires a column named 'Guest Name', 'Attendee Name', or 'Name'.",
    noRoomsParsed: 'No rooms successfully parsed. Check formatting.',
    unknownBedType: 'Unknown bed type: "{{type}}"',
    unexpected: 'An unexpected parsing error occurred.'
  }
}

const esCsvImport = {
  title: 'Configuración de Datos CSV',
  subtitle: 'Pega datos CSV o sube archivos, luego haz clic en Procesar para cargar en el espacio de trabajo.',
  rooms: {
    label: 'Lista de Habitaciones (formato CSV)',
    uploadFile: 'Subir archivo .csv',
    count: '{{count}} Habitaciones'
  },
  registrants: {
    label: 'Registrantes e Inscripciones (formato CSV)',
    uploadFile: 'Subir archivo .csv',
    count: '{{count}} Registrantes'
  },
  processButton: 'Procesar y Cargar Listas',
  columnGuide: {
    title: 'Guía de Formato y Mapeo de Columnas CSV',
    bedRulesTitle: 'Reglas de Configuración de Camas:',
    registrantColumnsTitle: 'Columnas de Registrantes:',
    registrantColumnsDetail:
      'Necesita <code>Name</code>. La cama preferida se asigna a una configuración; la habitación preferida coincide con el Tipo de Habitación (p. ej., <code>Standard</code>).'
  },
  success:
    '¡Se cargaron exitosamente {{rooms}} Habitaciones y {{participants}} Participantes en el tablero de asignación!',
  errors: {
    roomsMinRows: 'El CSV de habitaciones debe tener al menos una cabecera y una fila de datos.',
    roomsMissingRoomColumn: "El CSV de habitaciones requiere una columna llamada 'Room' o 'Room ID'.",
    roomsMissingBedColumn: "El CSV de habitaciones requiere una columna llamada 'Bed Configuration' o 'Beds'.",
    participantsMinRows: 'El CSV de participantes debe tener al menos una cabecera y una fila de datos.',
    participantsMissingNameColumn:
      "El CSV de participantes requiere una columna llamada 'Guest Name', 'Attendee Name' o 'Name'.",
    noRoomsParsed: 'No se pudieron analizar habitaciones. Revisa el formato.',
    unknownBedType: 'Tipo de cama desconocido: "{{type}}"',
    unexpected: 'Ocurrió un error de análisis inesperado.'
  }
}

beforeEach(() => {
  i18n.addResourceBundle('en', 'csvImport', enCsvImport, true, true)
  i18n.addResourceBundle('es', 'csvImport', esCsvImport, true, true)
  i18n.changeLanguage('en')
})

afterEach(() => {
  i18n.changeLanguage('en')
})

describe('CsvImport — csvImport namespace', () => {
  it('renders Spanish title when locale is es', async () => {
    await i18n.changeLanguage('es')
    render(<CsvImport />)
    expect(screen.getByText('Configuración de Datos CSV')).toBeInTheDocument()
  })

  it('renders Spanish process button when locale is es', async () => {
    await i18n.changeLanguage('es')
    render(<CsvImport />)
    expect(screen.getByRole('button', { name: 'Procesar y Cargar Listas' })).toBeInTheDocument()
  })
})

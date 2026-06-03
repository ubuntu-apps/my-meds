import type { Medication } from '../../features/meds/types'

interface MedInfoProps {
  name: string
  dosage?: string
  notes?: string
  nameClassName?: string
  doseClassName?: string
  notesClassName?: string
}

export function MedInfo({
  name,
  dosage,
  notes,
  nameClassName = 'dose-card__name',
  doseClassName = 'dose-card__dose',
  notesClassName = 'dose-card__notes',
}: MedInfoProps) {
  return (
    <>
      <div className={nameClassName}>{name}</div>
      {dosage && <div className={doseClassName}>{dosage}</div>}
      {notes && <div className={notesClassName}>{notes}</div>}
    </>
  )
}

export function MedInfoFromMed({ med, nameClassName }: { med: Medication; nameClassName?: string }) {
  return <MedInfo name={med.name} dosage={med.dosage} notes={med.notes} nameClassName={nameClassName} />
}

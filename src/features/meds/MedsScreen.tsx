import { Plus, Pill } from 'lucide-react'
import { Button, EmptyState, ScreenHeader } from '../../components/ui'
import type { AppData, Medication } from './types'
import { sortMedications } from './schedule'
import { MedCard } from './components/MedCard'

interface MedsScreenProps {
  data: AppData
  onAdd: () => void
  onEdit: (med: Medication) => void
  onToggleActive: (med: Medication, active: boolean) => void
}

export function MedsScreen({ data, onAdd, onEdit, onToggleActive }: MedsScreenProps) {
  const meds = sortMedications(data.medications)

  return (
    <section className="screen">
      <ScreenHeader
        eyebrow="Your list"
        title="Medications"
        trailing={
          <Button variant="primary" onClick={onAdd}>
            <Plus size={18} /> Add
          </Button>
        }
      />

      {meds.length === 0 ? (
        <EmptyState
          icon={Pill}
          message="No medications yet. Add one to start tracking."
          action={{ label: 'Add medication', onClick: onAdd }}
        />
      ) : (
        <ul className="med-list">
          {meds.map((med) => (
            <MedCard key={med.id} med={med} onEdit={onEdit} onToggleActive={onToggleActive} />
          ))}
        </ul>
      )}
    </section>
  )
}

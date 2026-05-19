import { useNavigate } from 'react-router-dom'
import WizardOrcamento from '@/components/marketplace/WizardOrcamento'

export default function NovoOrcamento() {
  const navigate = useNavigate()

  return (
    <WizardOrcamento
      isOpen
      fullscreen
      onClose={() => navigate('/conta/orcamentos')}
    />
  )
}

import type { Ritmo } from '../utils/objetivos';

function rotuloStatus(ritmo: Ritmo) {
  const limite = ritmo.objetivo.tipo === 'limite';

  if (ritmo.status === 'nao-iniciado') return 'Não iniciado';

  if (ritmo.encerrado) {
    if (limite)
      return ritmo.atingido ? 'Dentro do limite' : 'Limite ultrapassado';
    return ritmo.atingido ? 'Meta atingida' : 'Meta não atingida';
  }

  if (ritmo.status === 'no-ritmo') return 'No ritmo';
  if (ritmo.status === 'atencao') return 'Atenção';
  return limite ? 'Gastando acima do esperado' : 'Abaixo do esperado';
}

const ESTILO_BADGE = {
  'nao-iniciado': 'bg-gray-100 text-gray-600',
  'no-ritmo': 'bg-forest-100 text-forest-800',
  atencao: 'bg-amber-100 text-amber-800',
  'fora-do-ritmo': 'bg-red-50 text-red-700',
} as const;

const ESTILO_BARRA = {
  'nao-iniciado': 'bg-gray-300',
  'no-ritmo': 'bg-forest-600',
  atencao: 'bg-amber-500',
  'fora-do-ritmo': 'bg-red-500',
} as const;

export function BadgeRitmo({ ritmo }: { ritmo: Ritmo }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILO_BADGE[ritmo.status]}`}
    >
      {rotuloStatus(ritmo)}
    </span>
  );
}

/** Barra de progresso com um marcador de quanto já deveria ter sido feito hoje. */
export function BarraRitmo({
  ritmo,
  className = '',
}: {
  ritmo: Ritmo;
  className?: string;
}) {
  const preenchido = Math.min(Math.max(ritmo.progresso, 0), 1) * 100;
  const marcador = ritmo.decorrido * 100;

  return (
    <div
      className={`relative h-3 rounded-full bg-forest-100 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(preenchido)}
    >
      <div
        className={`h-full rounded-full transition-all ${ESTILO_BARRA[ritmo.status]}`}
        style={{ width: `${preenchido}%` }}
      />
      {ritmo.diasDecorridos > 0 && (
        <div
          className="absolute -top-1 h-5 w-0.5 rounded bg-forest-950"
          style={{ left: `calc(${marcador}% - 1px)` }}
          title="Esperado até hoje"
        />
      )}
    </div>
  );
}

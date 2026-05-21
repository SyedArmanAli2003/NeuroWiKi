const typeStyles: Record<string, { bg: string; text: string; border: string }> = {
  concept: { 
    bg: 'rgba(99, 102, 241, 0.1)', 
    text: 'rgba(165, 180, 252, 0.9)', 
    border: 'rgba(99, 102, 241, 0.2)' 
  },
  person: { 
    bg: 'rgba(52, 211, 153, 0.1)', 
    text: 'rgba(110, 231, 183, 0.9)', 
    border: 'rgba(52, 211, 153, 0.2)' 
  },
  place: { 
    bg: 'rgba(251, 191, 36, 0.1)', 
    text: 'rgba(252, 211, 77, 0.9)', 
    border: 'rgba(251, 191, 36, 0.2)' 
  },
  event: { 
    bg: 'rgba(248, 113, 113, 0.1)', 
    text: 'rgba(252, 165, 165, 0.9)', 
    border: 'rgba(248, 113, 113, 0.2)' 
  },
  tool: { 
    bg: 'rgba(167, 139, 250, 0.1)', 
    text: 'rgba(196, 181, 253, 0.9)', 
    border: 'rgba(167, 139, 250, 0.2)' 
  },
  organization: { 
    bg: 'rgba(96, 165, 250, 0.1)', 
    text: 'rgba(147, 197, 253, 0.9)', 
    border: 'rgba(96, 165, 250, 0.2)' 
  },
  diary: { 
    bg: 'rgba(212, 165, 116, 0.1)', 
    text: 'rgba(212, 165, 116, 0.9)', 
    border: 'rgba(212, 165, 116, 0.2)' 
  },
}

const defaultStyle = { 
  bg: 'rgba(255, 255, 255, 0.04)', 
  text: 'rgba(245, 245, 244, 0.5)', 
  border: 'rgba(255, 255, 255, 0.08)' 
}

export function TypeBadge({ type }: { type: string }) {
  const style = typeStyles[type] || defaultStyle
  
  return (
    <span 
      className="text-[10px] font-medium tracking-wider uppercase px-2 py-1 rounded-md"
      style={{
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
    >
      {type}
    </span>
  )
}

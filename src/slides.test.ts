import { describe, it, expect } from 'vitest'
import { slides } from './slides'

describe('slides registry', () => {
  it('has exactly 13 slides', () => {
    expect(slides).toHaveLength(13)
  })

  it('all slides have a non-empty title and a component', () => {
    for (const slide of slides) {
      expect(slide.title.length).toBeGreaterThan(0)
      expect(typeof slide.component).toBe('function')
    }
  })

  it('slide titles match expected order', () => {
    const expected = [
      'Capa',
      'Sumário executivo',
      'Status por workstream',
      'Diagnóstico técnico',
      'Frentes em andamento',
      'Direção proposta',
      'Arquitetura de IA',
      'Arquitetura alvo 1.6',
      'Estratégia de implementação',
      'Decisões de arquitetura',
      'Roadmap',
      'Decisões necessárias',
      'Encerramento',
    ]
    expect(slides.map(s => s.title)).toEqual(expected)
  })

  it('no duplicate titles', () => {
    const titles = slides.map(s => s.title)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it('no duplicate components', () => {
    const components = slides.map(s => s.component)
    expect(new Set(components).size).toBe(components.length)
  })
})

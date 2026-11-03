'use client'

import React from 'react'
import { Character } from './DesignerScene'
import './designer-scene.css'
import './timeline-walker.css'

// The designer from the hero, standing on the path of the Work Experience climb. ExperienceClimb moves her along the
// path and sets data-walking / data-hop / data-play on this element as the reader scrolls; the pose and the walk
// and hop animations are the ones in timeline-walker.css (.wk-root). Decorative: aria-hidden. Position: experience-climb.css.

export function ClimbWalker() {
  return (
    <div className="sc-root wk-root pxc-walker" data-motion="on" data-play="false" data-walking="false" aria-hidden="true">
      <svg viewBox="-60 84 130 280" xmlns="http://www.w3.org/2000/svg">
        <Character />
      </svg>
    </div>
  )
}

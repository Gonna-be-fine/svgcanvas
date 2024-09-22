/**
 * DOM element selection box tools.
 * @module select
 * @license MIT
 *
 * @copyright 2010 Alexis Deveria, 2010 Jeff Schiller
 */

import { isWebkit } from '../common/browser.js'
import { getRotationAngle, getBBox, getStrokedBBox } from './utilities.js'
import { transformListToTransform, transformBox, transformPoint, matrixMultiply, getTransformList } from './math.js'
import { NS } from './namespaces'

let svgCanvas
let selectorManager_ // A Singleton
// change radius if touch screen
const gripRadius = window.ontouchstart ? 10 : 8
export const selectButtons = {
  se: {
    cursor: 'pointer',
    icon: 'delete.svg',
    imgBase64: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4gICAgICAgICAgICAgICAgPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4gICAgICAgICAgICAgICAgPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJUcmFzaEljb24iIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IiAgICAgICAgICAgICAgICB3aWR0aD0iMTI3LjU1OXB4IiBoZWlnaHQ9IjEyNy41NTlweCIgdmlld0JveD0iMCAwIDEyNy41NTkgMTI3LjU1OSIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMTI3LjU1OSAxMjcuNTU5IiAgICAgICAgICAgICAgICB4bWw6c3BhY2U9InByZXNlcnZlIj4gICAgICAgICAgIDxjaXJjbGUgaWQ9InRyYXNoQmFzZSIgZmlsbD0iI0ZGRkZGRiIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgY3g9IjYzLjc4MiIgY3k9IjY0LjY5NyIgcj0iNTguNDk3Ii8+ICAgICAgICAgICA8cGF0aCBpZD0idHJhc2giIGZpbGw9IiM2NjYiIGQ9Ik00OS40MzYsMjguOTU5Yy0wLjI1OSwxLjYyMS0wLjQ3MywzLjEzMS0wLjc2NCw0LjYyN2MtMC4wNSwwLjI1NS0wLjM4OSwwLjU1Mi0wLjY1OSwwLjY1ICAgICAgICAgICAgICAgIGMtMS45MTEsMC42OTQtMy44OTMsMS4yMjEtNS43NDQsMi4wNDRjLTEuMjg5LDAuNTc0LTIuNTI2LDEuNDAyLTMuNTczLDIuMzUxYy0xLjgwOCwxLjY0LTEuNzQ5LDMuNjEyLTAuMDIsNS4zNCAgICAgICAgICAgICAgICBjMS41MjUsMS41MjQsMy40NDIsMi40LDUuNDIzLDMuMTM3YzQuNDIyLDEuNjQ0LDkuMDM2LDIuMzgxLDEzLjcwOSwyLjc0NWM3LjA3LDAuNTUsMTQuMTE1LDAuMjkxLDIxLjAyMi0xLjM5NiAgICAgICAgICAgICAgICBjMi42MzYtMC42NDQsNS4xODItMS43MTgsNy42OTMtMi43NzZjMS4wMDgtMC40MjUsMS45MTItMS4yMzksMi42ODQtMi4wNDhjMS40MjEtMS40ODgsMS41MDQtMy4yMzQsMC4wMTEtNC42MyAgICAgICAgICAgICAgICBjLTEuMjY3LTEuMTg0LTIuNzk1LTIuMTY4LTQuMzU4LTIuOTMzYy0xLjYwNC0wLjc4NS0zLjM3Ny0xLjIzOC01LjEwMi0xLjc1MmMtMC42MDYtMC4xOC0wLjgzNy0wLjM4OS0wLjkwMS0xLjA1MiAgICAgICAgICAgICAgICBjLTAuMTM1LTEuMzgyLTAuNDI3LTIuNzQ5LTAuNjY2LTQuMTg1YzAuMDg3LTAuMDA0LDAuMzEtMC4wNjIsMC41MTEtMC4wMTljMy42NjcsMC43OTQsNy4yODYsMS43NjcsMTAuNTE5LDMuNzM5ICAgICAgICAgICAgICAgIGMxLjI3LDAuNzc1LDIuNDc4LDEuNzIzLDMuNTI1LDIuNzc5YzEuNjM5LDEuNjUzLDIuNDQzLDMuNzEzLDIuMzQ4LDYuMDg5Yy0wLjA2LDEuNTAyLDAuMDYxLDMuMDIxLTAuMTE3LDQuNTA3ICAgICAgICAgICAgICAgIGMtMC4yMjEsMS44NDQtMS4yMTQsMy4zNjMtMi40NjksNC43MjFjLTAuMjk1LDAuMzE5LTAuNTcxLDAuNzcyLTAuNjE0LDEuMTg4Yy0wLjk4MSw5LjQwNC0xLjkyOSwxOC44MTItMi44ODMsMjguMjIgICAgICAgICAgICAgICAgYy0wLjQwMSwzLjk1Ni0wLjc2Niw3LjkxNS0xLjIxNSwxMS44NjVjLTAuMjU0LDIuMjMzLTEuNDM5LDMuOTk5LTMuMTI1LDUuNDMyYy0yLjU4OCwyLjIwMS01LjY3NSwzLjM3Ni04LjkyNiw0LjEwOCAgICAgICAgICAgICAgICBjLTkuMjEyLDIuMDc2LTE4LjM2MiwxLjk5Ni0yNy4zNzUtMS4wNjdjLTIuMzk1LTAuODE0LTQuNTc3LTIuMDMyLTYuMzM0LTMuOTExYy0xLjM3NS0xLjQ3MS0yLjEwMy0zLjIwMy0yLjMwMy01LjIxMSAgICAgICAgICAgICAgICBjLTAuODQtOC40NDUtMS43MTUtMTYuODg2LTIuNTc4LTI1LjMyOWMtMC40NzktNC42ODctMC45NS05LjM3NC0xLjQ1OS0xNC4wNTdjLTAuMDQ2LTAuNDItMC4yNjEtMC44OTgtMC41NTItMS4yMDMgICAgICAgICAgICAgICAgYy0xLjc5Ni0xLjg4Mi0yLjc2LTQuMDctMi42NTQtNi42OThjMC4wMjQtMC42MDEsMC4wNDItMS4yMDYsMC0xLjgwNWMtMC4yNTctMy42OTIsMS4zNjUtNi40NTYsNC4yNTYtOC41NjMgICAgICAgICAgICAgICAgQzQwLjU2MiwzMS4wODcsNDQuOTg4LDI5Ljg4NCw0OS40MzYsMjguOTU5eiBNNjYuNDEsNzcuMjA3YzAtNS4yNDYsMC4wMTgtMTAuNDkzLTAuMDI2LTE1LjczOSAgICAgICAgICAgICAgICBjLTAuMDA1LTAuNTgyLTAuMjA0LTEuMzI3LTAuNTk0LTEuNzA3Yy0wLjkyMy0wLjg5OS0yLjEyOC0wLjg2Mi0zLjI4Ny0wLjQ1Yy0xLjA4OCwwLjM4Ni0xLjMyMiwxLjI5My0xLjMyMSwyLjM0MSAgICAgICAgICAgICAgICBjMC4wMDgsMTAuMzU5LDAuMDAyLDIwLjcxOCwwLjAwNywzMS4wNzdjMC4wMDEsMS44LDAuOTk1LDIuODgsMi42MTMsMi44ODZjMS42MTgsMC4wMDYsMi42MDYtMS4wNzMsMi42MDctMi44NjkgICAgICAgICAgICAgICAgQzY2LjQxNCw4Ny41NjYsNjYuNDEyLDgyLjM4Nyw2Ni40MSw3Ny4yMDd6IE03NS43NDUsOTAuNjM5Yy0wLjExMiwwLjkwOS0wLjA2NCwxLjc3NywwLjgzMSwyLjI5MyAgICAgICAgICAgICAgICBjMC45MzUsMC41MzksMS44NzgsMC4zNTUsMi43NTctMC4xNzFjMS4wNTYtMC42MzEsMS41NDMtMS42NDQsMS42OTMtMi44MTdjMC4xNy0xLjMyNCwwLjI4MS0yLjY1NSwwLjQxOS0zLjk4MyAgICAgICAgICAgICAgICBjMC41Ny01LjQ3OCwxLjE0LTEwLjk1NiwxLjcxLTE2LjQzNGMwLjM4My0zLjY4NSwwLjc5MS03LjM2OCwxLjEzNi0xMS4wNTdjMC4xNTUtMS42NjQtMC44MTYtMi40My0yLjQyOS0yLjAzMSAgICAgICAgICAgICAgICBjLTEuNzY3LDAuNDM2LTIuODU5LDEuOTQ5LTMuMDU0LDQuMTE0Yy0wLjI3MSwyLjk5Mi0wLjU3OSw1Ljk4LTAuODg1LDguOTY5Qzc3LjIwMSw3Ni41NjEsNzYuNDcxLDgzLjYsNzUuNzQ1LDkwLjYzOXogICAgICAgICAgICAgICAgTTUyLjAwNyw5MC45MzZjLTAuMTkyLTEuOTAyLTAuMzYzLTMuNjI5LTAuNTQxLTUuMzU2Yy0wLjU3My01LjU3OC0xLjE0Ny0xMS4xNTUtMS43MjMtMTYuNzMyICAgICAgICAgICAgICAgIGMtMC4zMTYtMy4wNTQtMC42MDctNi4xMTEtMC45NzEtOS4xNTljLTAuMTcxLTEuNDMtMS4wMTktMi40NTMtMi4zMjEtMy4wNDljLTEuNjEzLTAuNzM4LTMuMjgtMC4yMTQtMy4wMTUsMi4xMTUgICAgICAgICAgICAgICAgYzAuNjUxLDUuNzAzLDEuMjE4LDExLjQxNiwxLjgxMywxNy4xMjVjMC40ODgsNC42ODEsMC45NTYsOS4zNjMsMS40NTgsMTQuMDQyYzAuMTUzLDEuNDIxLDAuODE4LDIuNTU0LDIuMjAyLDMuMDk4ICAgICAgICAgICAgICAgIEM1MC42MzEsOTMuNjk3LDUyLjMzNCw5Mi43ODIsNTIuMDA3LDkwLjkzNnogTTYzLjc2OCwyNi4yNzVjLTEuNDA0LDAtMi44MDgtMC4wMjUtNC4yMTEsMC4wMDUgICAgICAgICAgICAgICAgYy0zLjkzMSwwLjA4NC03LjAxMywyLjk3MS03LjI1Nyw2Ljg3OGMtMC4xMSwxLjc2NS0wLjA5NywzLjU0NSwwLjAwMiw1LjMxYzAuMDI4LDAuNDk4LDAuNDQ2LDEuMTUzLDAuODc5LDEuNDE0ICAgICAgICAgICAgICAgIGMxLjE4NywwLjcxNSwyLjQ4OCwwLjY3NywzLjczNiwwLjA1MmMwLjY0OS0wLjMyNSwwLjk3MS0wLjg1MywwLjk1NC0xLjYxOWMtMC4wMzQtMS41MDMtMC4wMjktMy4wMDgtMC4wMDgtNC41MTEgICAgICAgICAgICAgICAgYzAuMDE3LTEuMjU2LDAuNjY1LTEuOTIsMS45MjctMS45MzFjMi42NC0wLjAyNCw1LjI4MS0wLjAyNyw3LjkyLTAuMDAzYzEuNDI1LDAuMDEzLDIuMDY1LDAuNjk0LDIuMDc0LDIuMTE5ICAgICAgICAgICAgICAgIGMwLjAwOSwxLjQzNy0wLjAzOSwyLjg3NiwwLjAyNCw0LjMxYzAuMDIsMC40NTUsMC4xOTYsMS4wMTYsMC41MDQsMS4zMjZjMS4wMTQsMS4wMiwzLjUyOCwxLjAxMiw0LjU0Mi0wLjAwMiAgICAgICAgICAgICAgICBjMC4yOTItMC4yOTIsMC40ODUtMC44MDgsMC40OTktMS4yMjljMC4wNTUtMS42MzYsMC4wNS0zLjI3NSwwLjAxLTQuOTEyYy0wLjA4OC0zLjYxMS0yLjcwNS02LjYzOS02LjI5My03LjA2MiAgICAgICAgICAgICAgICBjLTEuNzQ0LTAuMjA2LTMuNTMzLTAuMDM2LTUuMzAyLTAuMDM2QzYzLjc2OCwyNi4zNDgsNjMuNzY4LDI2LjMxMiw2My43NjgsMjYuMjc1eiIvPiAgICAgICAgICAgIDwvc3ZnPg==',
    size: 20,
    name: 'delete'
  },
  // sw: {
  //   cursor: 'pointer',
  //   icon: '../img/reset.svg',
  //   size: 20
  // },
}
/**
* Private class for DOM element selection boxes.
*/
export class Selector {
  /**
  * @param {Integer} id - Internally identify the selector
  * @param {Element} elem - DOM element associated with this selector
  * @param {module:utilities.BBoxObject} [bbox] - Optional bbox to use for initialization (prevents duplicate `getBBox` call).
  */
  constructor (id, elem, bbox) {
    // this is the selector's unique number
    this.id = id

    // this holds a reference to the element for which this selector is being used
    this.selectedElement = elem

    // this is a flag used internally to track whether the selector is being used or not
    this.locked = true

    // this holds a reference to the <g> element that holds all visual elements of the selector
    this.selectorGroup = svgCanvas.createSVGElement({
      element: 'g',
      attr: { id: ('selectorGroup' + this.id) }
    })

    // this holds a reference to the path rect
    this.selectorRect = svgCanvas.createSVGElement({
      element: 'path',
      attr: {
        id: ('selectedBox' + this.id),
        fill: 'none',
        stroke: '#22C',
        'stroke-width': '1',
        'stroke-dasharray': '5,5',
        // need to specify this so that the rect is not selectable
        style: 'pointer-events:none'
      }
    })
    this.selectorGroup.append(this.selectorRect)

    // this holds a reference to the grip coordinates for this selector
    this.gripCoords = {
      nw: null,
      n: null,
      ne: null,
      e: null,
      se: null,
      s: null,
      sw: null,
      w: null
    }

    this.reset(this.selectedElement, bbox)
  }

  /**
  * Used to reset the id and element that the selector is attached to.
  * @param {Element} e - DOM element associated with this selector
  * @param {module:utilities.BBoxObject} bbox - Optional bbox to use for reset (prevents duplicate getBBox call).
  * @returns {void}
  */
  reset (e, bbox) {
    this.locked = true
    this.selectedElement = e
    this.resize(bbox)
    this.selectorGroup.setAttribute('display', 'inline')
  }

  /**
  * Show the resize grips of this selector.
  * @param {boolean} show - Indicates whether grips should be shown or not
  * @returns {void}
  */
  showGrips (show) {
    const bShow = show ? 'inline' : 'none'
    selectorManager_.selectorGripsGroup.setAttribute('display', bShow)
    const elem = this.selectedElement
    this.hasGrips = show
    if (elem && show) {
      this.selectorGroup.append(selectorManager_.selectorGripsGroup)
      Selector.updateGripCursors(getRotationAngle(elem))
    }
  }

  /**
  * Updates the selector to match the element's size.
  * @param {module:utilities.BBoxObject} [bbox] - BBox to use for resize (prevents duplicate getBBox call).
  * @returns {void}
  */
  resize (bbox) {
    const dataStorage = svgCanvas.getDataStorage()
    const selectedBox = this.selectorRect
    const mgr = selectorManager_
    const selectedGrips = mgr.selectorGrips
    const selected = this.selectedElement
    const zoom = svgCanvas.getZoom()
    let offset = 1 / zoom
    const sw = selected.getAttribute('stroke-width')
    if (selected.getAttribute('stroke') !== 'none' && !isNaN(sw)) {
      offset += (sw / 2)
    }

    const { tagName } = selected
    if (tagName === 'text') {
      offset += 2 / zoom
    }

    // find the transformations applied to the parent of the selected element
    const svg = document.createElementNS(NS.SVG, 'svg')
    let parentTransformationMatrix = svg.createSVGMatrix()
    let currentElt = selected
    while (currentElt.parentNode) {
      if (currentElt.parentNode && currentElt.parentNode.tagName === 'g' && currentElt.parentNode.transform) {
        if (currentElt.parentNode.transform.baseVal.numberOfItems) {
          parentTransformationMatrix = matrixMultiply(transformListToTransform(getTransformList(selected.parentNode)).matrix, parentTransformationMatrix)
        }
      }
      currentElt = currentElt.parentNode
    }

    // loop and transform our bounding box until we reach our first rotation
    const tlist = getTransformList(selected)

    // combines the parent transformation with that of the selected element if necessary
    const m = parentTransformationMatrix ? matrixMultiply(parentTransformationMatrix, transformListToTransform(tlist).matrix) : transformListToTransform(tlist).matrix

    // This should probably be handled somewhere else, but for now
    // it keeps the selection box correctly positioned when zoomed
    m.e *= zoom
    m.f *= zoom

    if (!bbox) {
      bbox = getBBox(selected)
    }
    // TODO: getBBox (previous line) already knows to call getStrokedBBox when tagName === 'g'. Remove this?
    // TODO: getBBox doesn't exclude 'gsvg' and calls getStrokedBBox for any 'g'. Should getBBox be updated?
    if (tagName === 'g' && !dataStorage.has(selected, 'gsvg')) {
      // The bbox for a group does not include stroke vals, so we
      // get the bbox based on its children.
      const strokedBbox = getStrokedBBox([selected.childNodes])
      if (strokedBbox) {
        bbox = strokedBbox
      }
    }

    if (bbox) {
      if(svgCanvas.getSelectedElements()[0].nodeName === 'text'){
        const padding = 20;
        bbox.x = bbox.x - padding
        bbox.y = bbox.y - padding
        bbox.width = bbox.width + 2 * padding
        bbox.height = bbox.height + 2 * padding
      }
      // apply the transforms
      const l = bbox.x; const t = bbox.y; const w = bbox.width; const h = bbox.height
      // bbox = {x: l, y: t, width: w, height: h}; // Not in use

      // we need to handle temporary transforms too
      // if skewed, get its transformed box, then find its axis-aligned bbox

      // *
      offset *= zoom

      const nbox = transformBox(l * zoom, t * zoom, w * zoom, h * zoom, m)
      const { aabox } = nbox
      let nbax = aabox.x - offset
      let nbay = aabox.y - offset
      let nbaw = aabox.width + (offset * 2)
      let nbah = aabox.height + (offset * 2)

      // now if the shape is rotated, un-rotate it
      const cx = nbax + nbaw / 2
      const cy = nbay + nbah / 2

      const angle = getRotationAngle(selected)
      if (angle) {
        const rot = svgCanvas.getSvgRoot().createSVGTransform()
        rot.setRotate(-angle, cx, cy)
        const rotm = rot.matrix
        nbox.tl = transformPoint(nbox.tl.x, nbox.tl.y, rotm)
        nbox.tr = transformPoint(nbox.tr.x, nbox.tr.y, rotm)
        nbox.bl = transformPoint(nbox.bl.x, nbox.bl.y, rotm)
        nbox.br = transformPoint(nbox.br.x, nbox.br.y, rotm)

        // calculate the axis-aligned bbox
        const { tl } = nbox
        let minx = tl.x
        let miny = tl.y
        let maxx = tl.x
        let maxy = tl.y

        const { min, max } = Math

        minx = min(minx, min(nbox.tr.x, min(nbox.bl.x, nbox.br.x))) - offset
        miny = min(miny, min(nbox.tr.y, min(nbox.bl.y, nbox.br.y))) - offset
        maxx = max(maxx, max(nbox.tr.x, max(nbox.bl.x, nbox.br.x))) + offset
        maxy = max(maxy, max(nbox.tr.y, max(nbox.bl.y, nbox.br.y))) + offset

        nbax = minx
        nbay = miny
        nbaw = (maxx - minx)
        nbah = (maxy - miny)
      }

      const dstr = 'M' + nbax + ',' + nbay +
        ' L' + (nbax + nbaw) + ',' + nbay +
        ' ' + (nbax + nbaw) + ',' + (nbay + nbah) +
        ' ' + nbax + ',' + (nbay + nbah) + 'z'

      const xform = angle ? 'rotate(' + [angle, cx, cy].join(',') + ')' : ''

      // TODO(codedread): Is this needed?
      //  if (selected === selectedElements[0]) {
      this.gripCoords = {
        nw: [nbax, nbay],
        ne: [nbax + nbaw, nbay],
        sw: [nbax, nbay + nbah],
        se: [nbax + nbaw, nbay + nbah],
        n: [nbax + (nbaw) / 2, nbay],
        w: [nbax, nbay + (nbah) / 2],
        e: [nbax + nbaw, nbay + (nbah) / 2],
        s: [nbax + (nbaw) / 2, nbay + nbah]
      }
      selectedBox.setAttribute('d', dstr)
      this.selectorGroup.setAttribute('transform', xform)
      Object.entries(this.gripCoords).forEach(([dir, coords]) => {
        if(selectedGrips[dir].nodeName === 'circle') {
          selectedGrips[dir].setAttribute('cx', coords[0])
          selectedGrips[dir].setAttribute('cy', coords[1])
        } else {
          const {width, height} = selectedGrips[dir].getBBox();
          selectedGrips[dir].setAttribute('x', coords[0] - width/2);
          selectedGrips[dir].setAttribute('y', coords[1]- height/2);
        }
      })

      // we want to go 20 pixels in the negative transformed y direction, ignoring scale
      mgr.rotateGripConnector.setAttribute('x1', nbax + (nbaw) / 2)
      mgr.rotateGripConnector.setAttribute('y1', nbay)
      mgr.rotateGripConnector.setAttribute('x2', nbax + (nbaw) / 2)
      mgr.rotateGripConnector.setAttribute('y2', nbay - (gripRadius * 5))

      mgr.rotateGrip.setAttribute('cx', nbax + (nbaw) / 2)
      mgr.rotateGrip.setAttribute('cy', nbay - (gripRadius * 5))
    }
  }

  // STATIC methods
  /**
  * Updates cursors for corner grips on rotation so arrows point the right way.
  * @param {Float} angle - Current rotation angle in degrees
  * @returns {void}
  */
  static updateGripCursors (angle) {
    const dirArr = Object.keys(selectorManager_.selectorGrips)
    let steps = Math.round(angle / 45)
    if (steps < 0) { steps += 8 }
    while (steps > 0) {
      dirArr.push(dirArr.shift())
      steps--
    }
    Object.values(selectorManager_.selectorGrips).forEach((gripElement, i) => {
      let curGrip = Object.values(selectButtons).find(v => v.name === gripElement.getAttribute('name'))
      if(curGrip){
        gripElement.setAttribute('style', ('cursor:' + curGrip.cursor))
        return;
      }
      gripElement.setAttribute('style', ('cursor:' + dirArr[i] + '-resize'))
    })
  }
}

/**
* Manage all selector objects (selection boxes).
*/
export class SelectorManager {
  /**
   * Sets up properties and calls `initGroup`.
   */
  constructor () {
    // this will hold the <g> element that contains all selector rects/grips
    this.selectorParentGroup = null

    // this is a special rect that is used for multi-select
    this.rubberBandBox = null

    // this will hold objects of type Selector (see above)
    this.selectors = []

    // this holds a map of SVG elements to their Selector object
    this.selectorMap = {}

    // this holds a reference to the grip elements
    this.selectorGrips = {
      nw: null,
      n: null,
      ne: null,
      e: null,
      se: null,
      s: null,
      sw: null,
      w: null
    }

    this.selectorGripsGroup = null
    this.rotateGripConnector = null
    this.rotateGrip = null

    this.initGroup()
  }

  /**
  * Resets the parent selector group element.
  * @returns {void}
  */
  initGroup () {
    const dataStorage = svgCanvas.getDataStorage()
    // remove old selector parent group if it existed
    if (this.selectorParentGroup?.parentNode) {
      this.selectorParentGroup.remove()
    }

    // create parent selector group and add it to svgroot
    this.selectorParentGroup = svgCanvas.createSVGElement({
      element: 'g',
      attr: { id: 'selectorParentGroup' }
    })
    this.selectorGripsGroup = svgCanvas.createSVGElement({
      element: 'g',
      attr: { display: 'none' }
    })
    this.selectorParentGroup.append(this.selectorGripsGroup)
    svgCanvas.getSvgRoot().append(this.selectorParentGroup)

    this.selectorMap = {}
    this.selectors = []
    this.rubberBandBox = null

    // add the corner grips
    Object.keys(this.selectorGrips).forEach((dir) => {
      let grip = null;
      // 左侧
      if(Object.keys(selectButtons).includes(dir)) {
        grip = this.createIconSelector({
          dir,
          size: selectButtons[dir]?.size || 20,
          href: selectButtons[dir].imgBase64 ? selectButtons[dir].imgBase64 : svgCanvas.curConfig.imgPath + selectButtons[dir].icon,
          name: selectButtons[dir].name
        })
      }else {
        grip = svgCanvas.createSVGElement({
          element: 'circle',
          attr: {
            id: 'selectorGrip_resize_' + dir,
            fill: '#d8d8d8',
            r: gripRadius,
            style: 'cursor:' + dir + '-resize',
            // This expands the mouse-able area of the grips making them
            // easier to grab with the mouse.
            // This works in Opera and WebKit, but does not work in Firefox
            // see https://bugzilla.mozilla.org/show_bug.cgi?id=500174
            'stroke-width': 2,
            'pointer-events': 'all'
          }
        });
      }
      dataStorage.put(grip, 'dir', dir);
      dataStorage.put(grip, 'type', 'resize');
      this.selectorGrips[dir] = grip;
      this.selectorGripsGroup.append(grip);
    });

    // add rotator elems
    this.rotateGripConnector =
      svgCanvas.createSVGElement({
        element: 'line',
        attr: {
          id: ('selectorGrip_rotateconnector'),
          stroke: '#22C',
          'stroke-width': '1'
        }
      })
    this.selectorGripsGroup.append(this.rotateGripConnector)

    this.rotateGrip =
      svgCanvas.createSVGElement({
        element: 'circle',
        attr: {
          id: 'selectorGrip_rotate',
          fill: 'lime',
          r: gripRadius,
          stroke: '#22C',
          'stroke-width': 2,
          style: `cursor:url(${svgCanvas.curConfig.imgPath}/rotate.svg) 12 12, auto;`
        }
      })
    this.selectorGripsGroup.append(this.rotateGrip)
    dataStorage.put(this.rotateGrip, 'type', 'rotate')

    if (document.getElementById('canvasBackground')) { return }

    const [width, height] = svgCanvas.curConfig.dimensions
    const canvasbg = svgCanvas.createSVGElement({
      element: 'svg',
      attr: {
        id: 'canvasBackground',
        width,
        height,
        x: 0,
        y: 0,
        overflow: (isWebkit() ? 'none' : 'visible'), // Chrome 7 has a problem with this when zooming out
        style: 'pointer-events:none'
      }
    })

    const rect = svgCanvas.createSVGElement({
      element: 'rect',
      attr: {
        width: '100%',
        height: '100%',
        x: 0,
        y: 0,
        'stroke-width': 1,
        stroke: '#000',
        fill: '#FFF',
        style: 'pointer-events:none'
      }
    })
    canvasbg.append(rect)
    svgCanvas.getSvgRoot().insertBefore(canvasbg, svgCanvas.getSvgContent())
  }


  createIconSelector ({dir, size, href, name}) {
    return svgCanvas.createSVGElement({
      element: 'image',
      attr: {
        id: 'selectorGrip_resize_' + dir,
        width: size,
        height: size,
        href,
        style: 'cursor: pointer',
        // This expands the mouse-able area of the grips making them
        // easier to grab with the mouse.
        // This works in Opera and WebKit, but does not work in Firefox
        // see https://bugzilla.mozilla.org/show_bug.cgi?id=500174
        'stroke-width': 2,
        'pointer-events': 'all',
        name
      }
    });
  }

  /**
  *
  * @param {Element} elem - DOM element to get the selector for
  * @param {module:utilities.BBoxObject} [bbox] - Optional bbox to use for reset (prevents duplicate getBBox call).
  * @returns {Selector} The selector based on the given element
  */
  requestSelector (elem, bbox) {
    if (!elem) { return null }

    const N = this.selectors.length
    // If we've already acquired one for this element, return it.
    if (typeof this.selectorMap[elem.id] === 'object') {
      this.selectorMap[elem.id].locked = true
      return this.selectorMap[elem.id]
    }
    for (let i = 0; i < N; ++i) {
      if (!this.selectors[i]?.locked) {
        this.selectors[i].locked = true
        this.selectors[i].reset(elem, bbox)
        this.selectorMap[elem.id] = this.selectors[i]
        return this.selectors[i]
      }
    }
    // if we reached here, no available selectors were found, we create one
    this.selectors[N] = new Selector(N, elem, bbox)
    this.selectorParentGroup.append(this.selectors[N].selectorGroup)
    this.selectorMap[elem.id] = this.selectors[N]
    return this.selectors[N]
  }

  /**
  * Removes the selector of the given element (hides selection box).
  *
  * @param {Element} elem - DOM element to remove the selector for
  * @returns {void}
  */
  releaseSelector (elem) {
    if (!elem) { return }
    const N = this.selectors.length
    const sel = this.selectorMap[elem.id]
    if (!sel?.locked) {
      // TODO(codedread): Ensure this exists in this module.
      console.warn('WARNING! selector was released but was already unlocked')
    }
    for (let i = 0; i < N; ++i) {
      if (this.selectors[i] && this.selectors[i] === sel) {
        delete this.selectorMap[elem.id]
        sel.locked = false
        sel.selectedElement = null
        sel.showGrips(false)

        // remove from DOM and store reference in JS but only if it exists in the DOM
        try {
          sel.selectorGroup.setAttribute('display', 'none')
        } catch (e) { /* empty fn */ }

        break
      }
    }
  }

  /**
  * @returns {SVGRectElement} The rubberBandBox DOM element. This is the rectangle drawn by
  * the user for selecting/zooming
  */
  getRubberBandBox () {
    if (!this.rubberBandBox) {
      this.rubberBandBox =
        svgCanvas.createSVGElement({
          element: 'rect',
          attr: {
            id: 'selectorRubberBand',
            fill: '#22C',
            'fill-opacity': 0.15,
            stroke: '#22C',
            'stroke-width': 0.5,
            display: 'none',
            style: 'pointer-events:none'
          }
        })
      this.selectorParentGroup.append(this.rubberBandBox)
    }
    return this.rubberBandBox
  }
}

/**
 * An object that creates SVG elements for the canvas.
 *
 * @interface module:select.SVGFactory
 */
/**
 * @function module:select.SVGFactory#createSVGElement
 * @param {module:utilities.EditorContext#addSVGElementsFromJson} jsonMap
 * @returns {SVGElement}
 */
/**
 * @function module:select.SVGFactory#svgRoot
 * @returns {SVGSVGElement}
 */
/**
 * @function module:select.SVGFactory#svgContent
 * @returns {SVGSVGElement}
 */
/**
 * @function module:select.SVGFactory#getZoom
 * @returns {Float} The current zoom level
 */

/**
 * @typedef {GenericArray} module:select.Dimensions
 * @property {Integer} length 2
 * @property {Float} 0 Width
 * @property {Float} 1 Height
 */
/**
 * @typedef {PlainObject} module:select.Config
 * @property {string} imgPath
 * @property {module:select.Dimensions} dimensions
 */

/**
 * Initializes this module.
 * @function module:select.init
 * @param {module:select.Config} config - An object containing configurable parameters (imgPath)
 * @param {module:select.SVGFactory} svgFactory - An object implementing the SVGFactory interface.
 * @returns {void}
 */
export const init = (canvas) => {
  svgCanvas = canvas
  selectorManager_ = new SelectorManager()
}

/**
 * @function module:select.getSelectorManager
 * @returns {module:select.SelectorManager} The SelectorManager instance.
 */
export const getSelectorManager = () => selectorManager_

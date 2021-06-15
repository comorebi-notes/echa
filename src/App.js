import React, { useState, useEffect, useRef } from 'react'
import './App.sass'

const App = () => {
  const svgElement = useRef(null)

  const [elements, setElements] = useState([])
  const [selectedColor, setSelectedColor] = useState('black')
  const [selectedMode, setSelectedMode] = useState('drawLine')
  const [strokeWidth, setStrokeWidth] = useState(5)
  const [lineId, setLineId] = useState(0)

  const [drawing, setDrawing] = useState(false)

  const colors = ['black', 'red', 'blue', 'green', 'yellow', 'purple', 'cyan']

  useEffect(() => {
    // elementsCollectionRef = db
    //   .collection('rooms')
    //   .doc($route.params.roomId)
    //   .collection('elements')
    // elementsCollectionRef.onSnapshot((querySnapshot) => {
    //   elements = []
    //   querySnapshot.forEach((doc) => {
    //     const element = doc.data()
    //     element.id = doc.id
    //     elements.push(element)
    //   })
    // })
  }, [])

  const dragMoveHandler = (event) => {
    if (!drawing) return

    let newElement = elements.find((element) => element.id === lineId)
    if (!newElement) newElement = { id: lineId, points: [], color: selectedColor, strokeWidth }

    const rect = svgElement.current.getBoundingClientRect()

    if (event.touches) {
      event.clientX = event.touches[0].clientX
      event.clientY = event.touches[0].clientY
    }
    newElement.points.push({
      x: event.clientX - rect.x,
      y: event.clientY - rect.y,
    })

    const nextElements = elements.filter((element) => element.id !== lineId)
    nextElements.push(newElement)
    setElements(nextElements)
  }

  const dragEndHandler = () => setLineId(lineId + 1)

  const dragStart = () => {
    // addNewElement(newElement)
    if (selectedMode === 'drawLine') {
      setDrawing(true)
    } else if (selectedMode === 'erase') {
      // dragMoveHandler = () => {
      //   const target = event.touches
      //     ? document.elementFromPoint(
      //       event.touches[0].clientX,
      //       event.touches[0].clientY
      //     )
      //     : event.target
      //   if (target.tagName === 'polyline') {
      //     const elementId = target.getAttribute('element-id')
      //     elementsCollectionRef.doc(elementId).delete()
      //   }
      // }
    }
  }
  const dragMove = (event) => {
    if (dragMoveHandler && event) dragMoveHandler(event)
  }
  const dragEnd = (event) => {
    if (dragEndHandler && event) {
      dragEndHandler(event)
      setDrawing(false)
    }
  }
  const clickDrawMode = (color) => {
    setSelectedMode('drawLine')
    setSelectedColor(color)
  }
  const clearBoard = () => {
    setElements([])
    // if (!confirm('ボードをクリアしますか？')) return
    // const query = elementsCollectionRef.limit(500)
    // const snapshot = await query.get()
    // const batch = db.batch()
    // snapshot.docs.forEach((doc) => {
    //   batch.delete(doc.ref)
    // })
    // return await batch.commit()
  }
  // const leaveRoom = () => {
  //   // if (!confirm('このボードから退出しますか？')) return
  //   // $router.push('/')
  // }
  const undo = () => {
    const nextElements = [].concat(elements)
    nextElements.pop()
    setElements(nextElements)
  }

  return (
    <div className="container">
      <div className="header">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            style={{ backgroundColor: color }}
            disabled={selectedMode === 'drawLine' && color === selectedColor}
            onClick={() => clickDrawMode(color)}
          >
            {color}
          </button>
        ))}
        <button
          type="button"
          disabled={selectedMode === 'erase'}
          onClick={() => setSelectedMode('erase')}
        >
          <strong>消しゴム</strong>
        </button>
        <button
          type="button"
          onClick={undo}
        >
          <strong>1つ戻る</strong>
        </button>
        <button
          type="button"
          onClick={clearBoard}
        >
          <strong>全消去</strong>
        </button>
        <div style={{ display: 'inline-block' }}>
          <input type="range" id="width" defaultValue={strokeWidth} min="1" max="9" onChange={(e) => setStrokeWidth(e.target.value)}/>
          <label htmlFor="width">線の太さ</label>
        </div>
      </div>
      <svg
        ref={svgElement}
        className="canvas"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        onMouseDown={dragStart}
        onMouseMove={dragMove}
        onMouseUp={dragEnd}
        onTouchStart={dragStart}
        onTouchMove={dragMove}
        onTouchEnd={dragEnd}
      >
        {elements.map((element => (
          <polyline
            key={element.id}
            fill="none"
            stroke={element.color}
            strokeLinecap="round"
            strokeWidth={element.strokeWidth}
            points={element.points.map((point) => `${point.x},${point.y}`).join(' ')}
          />
        )))}
      </svg>
    </div>
  )
}


export default App

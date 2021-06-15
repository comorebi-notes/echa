import React, { useState, useEffect, useRef } from 'react'
import firebase from 'firebase'
import './App.sass'

const colors = ['black', 'red', 'blue', 'green', 'yellow', 'purple', 'cyan']

const App = () => {
  const svgElement = useRef(null)

  const [roomId, setRoomId] = useState()
  const [nextRoomId, setNextRoomId] = useState()
  const [database, setDatabase] = useState()
  const [elementsCollectionRef, setElementsCollectionRef] = useState()

  const [elements, setElements] = useState([])
  const [selectedColor, setSelectedColor] = useState('black')
  const [selectedMode, setSelectedMode] = useState('drawLine')
  const [strokeWidth, setStrokeWidth] = useState(5)
  const [lineId, setLineId] = useState(0)
  const [drawing, setDrawing] = useState(false)

  // roomId 初期化
  useEffect(() => {
    const url = window.location.href
    if (url.includes('room_id=')) {
      const regex = new RegExp('[?&]room_id(=([^&#]*)|&|#|$)')
      const results = regex.exec(url)
      setRoomId(decodeURIComponent(results[2].replace(/\+/g, ' ')))
    } else {
      const newRoomId = Math.random().toString(32).substring(2)
      window.history.replaceState('', '', `/?room_id=${newRoomId}`)
      setRoomId(newRoomId)
    }
  }, [roomId])

  // データベース初期化
  useEffect(() => {
    if (roomId) {
      const newDatabase = firebase.firestore()
      setDatabase(newDatabase)
    }
  }, [roomId])
  useEffect(() => {
    if (roomId && database) setElementsCollectionRef(database.collection('rooms').doc(roomId).collection('elements'))
  }, [roomId, database])
  useEffect(() => {
    if (roomId && elements && elementsCollectionRef) {
      elementsCollectionRef.onSnapshot((querySnapshot) => {
        const nextElements = [].concat(elements)
        querySnapshot.forEach((doc) => {
          const element = doc.data()
          element.id = doc.id
          nextElements.push(element)
        })
        setElements(nextElements)
      })
    }
  }, [roomId, elementsCollectionRef])

  const dragMoveHandler = (event) => {
    if (!drawing) return

    if (selectedMode === 'drawLine') {
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
    } else if (selectedMode === 'erase') {
      const target = event.touches
        ? document.elementFromPoint(
          event.touches[0].clientX,
          event.touches[0].clientY
        )
        : event.target
      if (target.tagName === 'polyline') {
        const elementId = target.getAttribute('id')
        elementsCollectionRef.doc(elementId).delete()
      }
    }
  }

  const dragEndHandler = () => {
    const element = elements.find((element) => element.id === lineId)
    if (element) {
      setLineId(lineId + 1)
      elementsCollectionRef.add(element)
    }
  }

  const dragStart = () => setDrawing(true)
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
  const clearBoard = async () => {
    const query = elementsCollectionRef.limit(5000)
    const snapshot = await query.get()
    const batch = database.batch()
    snapshot.docs.forEach((doc) => batch.delete(doc.ref))
    setElements([])
    return await batch.commit()
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
            id={element.id}
            fill="none"
            stroke={element.color}
            strokeLinecap="round"
            strokeWidth={element.strokeWidth}
            points={element.points.map((point) => `${point.x},${point.y}`).join(' ')}
          />
        )))}
      </svg>
      <div className="next-room">
        <input type="text" defaultValue={roomId} onChange={(e) => setNextRoomId(e.target.value)} />
        <button type="button" onClick={() => { window.location.href = `/?room_id=${nextRoomId}` }}>
          部屋を移動する
        </button>
      </div>
    </div>
  )
}


export default App

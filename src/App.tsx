import {data} from "./data.ts";
import {useCallback, useEffect, useState, useTransition} from "react";

const X_OFFSET = 50
const Y_OFFSET = 50

const series = data

const xLength = data[0].points.length
const yLength = data.length

const useResizeObserver = () => {
    const [dimensions, setDimensions] = useState({width: 0, height: 0})
    const [node, setNode] = useState<HTMLElement | null>(null)

    const registerNode = useCallback((element: HTMLElement | null) => {
        setNode(element)
    }, [])

    useEffect(() => {
        if (!node) {
            setDimensions({width: 0, height: 0})
            return
        }

        const observer = new ResizeObserver(([entry]) => {
            if (!entry) {
                return
            }
            const width = entry?.contentRect?.width ?? 0
            const height = entry?.contentRect?.height ?? 0

            setDimensions({width, height})

        })
        observer.observe(node)

        return () => {
            observer.disconnect()
        }


    }, [node]);

    return {registerNode, dimensions}
}

function App() {

    const {dimensions, registerNode} = useResizeObserver()


    const {
        width: cellWidth,
        height: cellHeight
    } = equalizeDimensions(Math.max(Math.floor((dimensions.width - X_OFFSET) / xLength), 0),
        Math.max(Math.floor((dimensions.height - Y_OFFSET) / yLength), 0))

    const yLabels = series.map((item) => item.yLabel)

    return (

        <div style={{width: "50vw", height: "50vh"}}>
            <div style={{width: "100%", height: "100%"}} ref={registerNode}>
                <svg width={"100%"} height="100%">
                    <g>
                        {yLabels.map((label, labelIndex) => <text x={`${X_OFFSET / 2}px`}
                                                                  y={`${cellHeight * labelIndex + cellHeight / 2}px`}
                                                                  textAnchor="middle"
                                                                  alignmentBaseline="middle"
                                                                  fill="black">{label}</text>)}
                    </g>
                    {series.map((item, index) => {
                        return <g transform={`translate(${X_OFFSET}, ${index * cellHeight})`}>
                            {item.points.map((point, pointIndex) => {
                                const width = `${cellWidth}px`
                                const height = `${cellHeight}px`
                                return <>
                                    <rect width={width} height={height} x={pointIndex * cellWidth} y={0} fill="black"
                                          stroke="white"
                                          strokeWidth="1px"/>
                                    <text x={`${pointIndex * cellWidth + cellWidth / 2}px`} y={`${cellHeight / 2}px`}
                                          textAnchor="middle"
                                          alignmentBaseline="middle"
                                          fill="white">{point.value}</text>
                                </>
                            })}
                        </g>
                    })}
                </svg>

            </div>

        </div>
    )
}

export default App


const equalizeDimensions = (width, height) => {
    if (width > height) {
        width = height
    } else {
        height = width
    }

    return {width, height}
}

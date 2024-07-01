import {Fragment, useEffect, useState} from "react";
import {data} from "./data.ts";

type HeatMapServiceState = {
    yLabelWidth: number
    xLabelHeight: number
    cellWidth: number
    cellHeight: number
}


const equalizeDimensions = (width, height) => {
    if (width > height) {
        width = height
    } else {
        height = width
    }

    return {width, height}
}

class HeatMapService {
    private yLabelWidth = 0
    private xLabelHeight = 0
    private cellWidth = 0
    private cellHeight = 0
    private parentDimensions = {width: 0, height: 0}
    private dataDimensions = {x: 0, y: 0}

    private listener?: (state: HeatMapServiceState) => void

    calcLayout = () => {
        if ([this.xLabelHeight,
            this.yLabelWidth,
            this.parentDimensions.height,
            this.parentDimensions.width,
            this.dataDimensions.y,
            this.dataDimensions.x].includes(0)) {
            return
        }

        const {
            width,
            height
        } = equalizeDimensions(
            Math.max(Math.floor((this.parentDimensions.width - this.yLabelWidth) / this.dataDimensions.x), 0),
            Math.max(Math.floor((this.parentDimensions.height - this.xLabelHeight) / this.dataDimensions.y), 0))

        this.cellHeight = height
        this.cellWidth = width

        this.emit()
    }


    getState() {
        return {
            yLabelWidth: this.yLabelWidth,
            xLabelHeight: this.xLabelHeight,
            cellWidth: this.cellWidth,
            cellHeight: this.cellHeight,
        }
    }

    subscribe = (listener: (state: HeatMapServiceState) => void) => {
        this.listener = listener

        return () => {
            this.listener = undefined
        }
    }

    emit = () => {
        this.listener?.(this.getState())
    }

    registerYLabelGroup = (node: SVGGElement | null) => {
        if (!node) return
        this.yLabelWidth = node.getBBox().width
        this.calcLayout()
    }

    registerXLabelGroup = (node: SVGGElement | null) => {
        if (!node) return
        this.xLabelHeight = node.getBBox().height
        this.calcLayout()
    }

    registerParent = (parent: HTMLDivElement | null) => {
        if (!parent) return

        this.parentDimensions.height = parent.offsetHeight
        this.parentDimensions.width = parent.offsetWidth
        this.calcLayout()
    }

    setDataDimensions = (x: number, y: number) => {
        this.dataDimensions = {x, y}
        this.calcLayout()
    }

}

type Series = { yLabel: string, points: { value: number, xLabel: string }[] }[]

interface HeatMapProps {
    series: Series
}

export const HeatMap = ({series}: HeatMapProps) => {

    const [heatMapService] = useState(() => new HeatMapService())
    const [heatMapState, setHeatMapState] = useState(heatMapService.getState())

    useEffect(() => {
        return heatMapService.subscribe(setHeatMapState)
    }, [heatMapService]);

    const yLabels = series.map((item) => item.yLabel)
    const xLabels = series[0].points.map((point) => point.xLabel)
    const xLength = data[0].points.length
    const yLength = data.length

    useEffect(() => {
        heatMapService.setDataDimensions(xLength, yLength)
    }, [xLength, yLength]);


    return <div style={{height: "100%", width: "100%"}} ref={heatMapService.registerParent}>
        <svg width={"100%"} height="100%">
            <YLabels labels={yLabels} registerGroup={heatMapService.registerYLabelGroup} heatMapState={heatMapState}/>
            <XLabels labels={xLabels} registerGroup={heatMapService.registerXLabelGroup} heatMapState={heatMapState}
                     yLength={yLength}/>
            <Series series={series} heatMapState={heatMapState}/>
        </svg>
    </div>
}

const Series = ({series, heatMapState}: { series: Series, heatMapState: HeatMapServiceState }) => {
    const {yLabelWidth, cellWidth, cellHeight} = heatMapState

    return <>
        {
            series.map((item, columnIndex) => {
                return <g transform={`translate(${yLabelWidth + cellWidth/2}, ${columnIndex * cellHeight})`} key={columnIndex}>
                    {item.points.map((point, rowIndex) => {
                        const width = `${cellWidth}px`
                        const height = `${cellHeight}px`
                        return <Fragment key={`${columnIndex}-${rowIndex}`}>
                            <rect width={width} height={height}  x={rowIndex * cellWidth} y={0} fill="black"
                                  stroke="white"
                                  strokeWidth="1px"/>
                            <text x={`${rowIndex * cellWidth + cellWidth / 2}px`} y={`${cellHeight / 2}px`}
                                  textAnchor="middle"
                                  alignmentBaseline="middle"
                                  fill="white">{point.value}</text>
                        </Fragment>
                    })}
                </g>
            })
        }
    </>

}


const YLabels = ({labels, registerGroup, heatMapState}: {
    labels: string[],
    registerGroup: (node: SVGGElement | null) => void
    heatMapState: HeatMapServiceState
}) => {
    const {yLabelWidth, cellWidth, cellHeight} = heatMapState

    return <g ref={registerGroup} x={0}>
        {labels.map((label, index) => <text
            key={index}
            x={`${yLabelWidth}px`}
            y={`${cellHeight * index + cellHeight / 2}px`}
            textAnchor="end"
            alignmentBaseline="middle"
            fill="black">{label}</text>)}
    </g>
}

const XLabels = ({labels, registerGroup, heatMapState, yLength}: {
    labels: string[],
    registerGroup: (node: SVGGElement | null) => void
    heatMapState: HeatMapServiceState
    yLength: number
}) => {
    const {yLabelWidth, cellWidth, cellHeight} = heatMapState

    return <g transform={`translate(${yLabelWidth}, ${yLength * cellHeight})`} ref={registerGroup}>
        {labels.map((label, index) => {
            const x = index * cellWidth + cellWidth / 2
            const y = cellHeight
            return <text
                key={index}
                x={`${x}px`}
                y={`${y}px`}
                transform={`rotate(-90, ${x}, ${y})`}
                textAnchor="middle"
                alignmentBaseline="middle"
                fill="black">{label}</text>
        })}
    </g>
}

import {useEffect, useState} from "react";
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

    registerParent = (parent: SVGSVGElement | null) => {
        if (!parent) return
        const rect = parent.getBBox()
        this.parentDimensions.height = rect.height
        this.parentDimensions.width = rect.width
        this.calcLayout()
    }

    setDataDimensions = (x: number, y: number) => {
        this.dataDimensions = {x, y}
    }

}

interface HeatMapProps {
    series: { yLabel: string, points: { value: number, xLabel: string } }[]
}

export const HeatMap = ({series}: HeatMapProps) => {

    const [heatMapService] = useState(() => new HeatMapService())
    const [heatMapState, setHeatMapState] = useState(heatMapService.getState())

    useEffect(() => {
        return heatMapService.subscribe(setHeatMapState)
    }, [heatMapService]);

    const yLabels = series.map((item) => item.yLabel)
    const xLength = data[0].points.length
    const yLength = data.length

    useEffect(() => {
        heatMapService.setDataDimensions(xLength, yLength)
    }, [xLength, yLength]);

    return <svg width={"100%"} height="100%">
        <YLabels labels={yLabels} registerGroup={heatMapService.registerYLabelGroup} heatMapState={heatMapState}/>
    </svg>
}


const YLabels = ({labels, registerGroup, heatMapState}: {
    labels: string[],
    registerGroup: (node: SVGGElement | null) => void
    heatMapState: HeatMapServiceState
}) => {
    const {yLabelWidth, cellWidth, cellHeight} = heatMapState

    return <g ref={registerGroup}>
        {labels.map((label, index) => <text
            key={index}
            x={`${yLabelWidth / 2 + cellWidth}px`}
            y={`${cellHeight * index + cellHeight / 2}px`}
            textAnchor="end"
            alignmentBaseline="middle"
            fill="black">{label}</text>)}
    </g>
}

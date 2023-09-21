import React, {useEffect, useRef} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';

export default function PlotD3(props){
    //this is a generic component for plotting a d3 plot
    const d3Container = useRef(null);
    //this automatically constructs an svg canvas the size of the parent container (height and width)
    //tTip automatically attaches a div of the class 'tooltip' if it doesn't already exist
    //this will automatically resize when the window changes so passing svg to a useeffect will re-trigger
    const [svg, height, width, tTip] = useSVGCanvas(d3Container);

    const margin = 50;
    const radius = 10;

    //you can use a hook like this to set up axes or things that don't require waiting for the data to load so it only draws once
    useEffect(()=>{
        if(svg !== undefined){
            console.log('here',height,width)
        }
    },[svg])

    //plot stuff here once the data loads
    useEffect(()=>{
        if(svg === undefined | props.data === undefined){ return }

        console.log(props.data);

        const data = props.data.months;
        
        
        //get data for each month
        const plotData = [];
        for(let months of data){
            let entry = {
                'count': months.count,
                'month': months.month,
                'deaths': months.highest_death,
                'order' : months.order
            }
            plotData.push(entry)
        }

        const [countMin, countMax] = d3.extent(plotData,d=>d.count);
        const [deathMin, deathMax] = d3.extent(plotData,d=>d.deaths);

        //get transforms for each value into x and y coordinates
        var xScale = d3.scaleBand()
            .range([ 0, width ])
            .domain(plotData.map(function(d) { return d.month; }))
            .padding(0.4);

        let yScale = d3.scaleLinear()
            .domain([500, countMax])
            .range([height-margin,margin]);
    
        //scale color by incident deaths
        let colorScale = d3.scaleLinear()
            .domain(d3.extent(plotData,d=>d.deaths))
            .range(['#f1fbee','#00441b']);

        //Order the months chronologically
        plotData.sort(function(a, b) {
                return d3.ascending(a.order, b.order)
              })

        xScale.domain(plotData.map(function(d) {
                return d.month;
              }));
            
        svg.selectAll("mybar").remove();
        svg.selectAll("mybar")
            .data(plotData)
            .enter()
            .append("rect")
              .attr("x", function(d) { return xScale(d.month) + 20; })
              .attr("y", function(d) { return yScale(d.count); })
              .attr("width", xScale.bandwidth())
              .attr("height", function(d) { return height - margin - yScale(d.count); })
              .attr("fill", d=> colorScale(d.deaths))
              .attr("opacity", 1)
              .on('mouseover',function(e, d){
                d3.select(this).transition()
                    .duration('50')
                    .attr("opacity", .5)
                let string = d.month + '</br>'
                    + 'Total deaths: ' + d.count + '<br>' 
                    + 'Highest death toll in single incident: ' + d.deaths;
                props.ToolTip.moveTTipEvent(tTip,e)
                tTip.html(string)
            }).on('mousemove',(e)=>{
                props.ToolTip.moveTTipEvent(tTip,e);
            }).on('mouseout',function(e, d){
                d3.select(this).transition()
                    .duration('50')
                    .attr("opacity", 1)
                props.ToolTip.hideTTip(tTip);
            });
           
        //change the title
        const labelSize = margin/3;
        svg.selectAll('text').remove();
        svg.append('text')
            .attr('x',width/2)
            .attr('y',labelSize)
            .attr('text-anchor','middle')
            .attr('font-size',labelSize)
            .attr('font-weight','bold')
            .text('Death Count per Month');

        svg.append('text')
            .attr('x',width/2)
            .attr('y', labelSize * 2.5)
            .attr('text-anchor','middle')
            .attr('font-size',15)
            .text("Color of bar represents the highest number of deaths in one incident");

        svg.append('text')
            .attr('x',width/2)
            .attr('y', height - labelSize + 10)
            .attr('text-anchor','middle')
            .attr('font-size',12)
            .text("Month and Year");


        //draw basic axes using the x and y scales
        svg.selectAll('g').remove()
        svg.append('g')
            .attr('transform',`translate(20,${height-margin})`)
            .call(d3.axisBottom(xScale))

        svg.append('g')
            .attr('transform',`translate(${margin-4},0)`)
            .call(d3.axisLeft(yScale))

    },[svg,props.data]);
    //the stuff in brackets what we listen for changes too. If you want to re-draw on other property changes add them here
    
    return (
        <div
            className={"d3-component"}
            style={{'height':'99%','width':'99%'}}
            ref={d3Container}
        ></div>
    );
}
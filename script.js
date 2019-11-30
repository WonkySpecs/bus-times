width = 800;
height = 600;
margin = { top: 30, right: 30, bottom: 30, left: 30 };

function ender(n) {
    s = " " + (n == 1 ? "minute" : "minutes") + " ";
    s += n > 0 ? "late" : "early";
    return s;
}

function setVal(id, num_minutes) {
    document.querySelector("#" + id).textContent = num_minutes + ender(num_minutes);
}

function setTextValues(diffs) {
    let median = diffs[Math.floor(diffs.length / 2)]
    let mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    setVal("meanVal", mean);
    setVal("medianVal", median);
    let sum = diffs.reduce((a, b) => a + b, 0);
    setVal("totalTime", sum);
    document.querySelector("#numBuses").textContent = diffs.length;

}

function drawBoxplot(data, groupFunc) {
    let svg = d3.select("#boxplot")
        .append("svg")
            .attr("width", margin.right + margin.left + width)
            .attr("height", margin.top + margin.bottom + height)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let grouped = d3.nest()
        .key(groupFunc)
        .rollup(function(d) {
            let diffs = d.map(o => o.diff).sort(d3.ascending);
            let q1 = d3.quantile(diffs, .25);
            let median = d3.quantile(diffs, .5);
            let q3 = d3.quantile(diffs, .75);
            let iqr = q3 - q1;
            let min = q1 - 1.5 * iqr;
            let max = q3 + 1.5 * iqr;
            return {
                q1: q1, median: median, q3: q3, min: min, max: max
            }})
        .entries(data);

    console.log(grouped);
    let x = d3.scaleBand()
        .range([0, width])
        .domain(grouped.map(g => g.key))
        .paddingInner(1)
        .paddingOuter(.5);
    svg.append("g")
        .attr("transform", "translate(0, " + height + ")")
        .call(d3.axisBottom(x));

    let mins = grouped.map(g => g.value.min);
    let maxes = grouped.map(g => g.value.max);
    let y = d3.scaleLinear()
        .range([height, 0])
        .domain([Math.min(...mins) * 1.1, Math.max(...maxes) * 1.1]);
    svg.append("g")
        .call(d3.axisLeft(y));

    svg.selectAll("vertLines")
        .data(grouped)
        .enter()
        .append("line")
            .attr("x1", d => x(d.key))
            .attr("x2", d => x(d.key))
            .attr("y1", d => y(d.value.min))
            .attr("y2", d => y(d.value.max))
            .attr("stroke", "black")
            .style("width", 40);

    boxWidth = 100;
    svg.selectAll("boxes")
        .data(grouped)
        .enter()
        .append("rect")
            .attr("x", d => x(d.key) - boxWidth / 2)
            .attr("y", d => y(d.value.q3))
            .attr("height", d => y(d.value.q1) - y(d.value.q3))
            .attr("width", boxWidth)
            .attr("stroke", "black")
            .attr("fill", "teal");

    svg.selectAll("medianLines")
        .data(grouped)
        .enter()
        .append("line")
            .attr("x1", d => x(d.key) - boxWidth / 2)
            .attr("x2", d => x(d.key) + boxWidth / 2)
            .attr("y1", d => y(d.value.median))
            .attr("y2", d => y(d.value.median))
            .attr("stroke", "black")
            .attr("width", 80);
}

function bindBoxplot(data) {
    radios = [
        { id: "all", func: o => "all" },
        { id: "busNum", func: o => o.bus_num },
        { id: "bus", func: o => o.expected.getHours() + ":" + o.expected.getMinutes() +
            "-" + o.bus_num } ];

    for (radio of radios) {
        let f = radio.func;
        document.querySelector("#boxplotGroupings #" + radio.id).onchange = function() {
            drawBoxplot(data, f);
        }
    }

    document.querySelector("#boxplotGroupings #busNum").checked = true;
    document.querySelector("#boxplotGroupings #busNum").onchange();
}

window.onload = function(ev) {
    d3.csv("data.csv").then(function(raw_data) {
        let data = raw_data.map(function(d) {
            let expected = new Date(d.expected);
            let actual = new Date(d.actual);
            return {
                bus_num: d.Num,
                expected: expected,
                actual: actual,
                diff: (actual - expected) / 60000
            }
        });
        let diffs = data.map(o => o.diff);
        diffs.sort()
        setTextValues(diffs);
        bindBoxplot(data);
    });
}

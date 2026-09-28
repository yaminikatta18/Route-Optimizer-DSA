/* =====================================================
   ROUTEOPT
   DSA-3 ROUTE OPTIMIZATION SYSTEM

   Core concepts:
   - Graph
   - Weighted edges
   - Bitmask
   - Dynamic Programming
   - Travelling Salesperson Problem
   - State compression
   - Route reconstruction
===================================================== */


/* =====================================================
   LOCATION DATA
===================================================== */

const locations = [
    "Hyderabad",
    "Secunderabad",
    "Kukatpally",
    "Madhapur",
    "Gachibowli",
    "LB Nagar"
];


/* =====================================================
   WEIGHTED GRAPH / DISTANCE MATRIX
===================================================== */

const distanceMatrix = [

    /* HYD */
    [0, 9, 12, 14, 16, 8],

    /* SEC */
    [9, 0, 10, 7, 13, 11],

    /* KUK */
    [12, 10, 0, 6, 10, 8],

    /* MDH */
    [14, 7, 6, 0, 5, 10],

    /* GCB */
    [16, 13, 10, 5, 0, 7],

    /* LBN */
    [8, 11, 8, 10, 7, 0]
];


/* =====================================================
   GLOBAL RESULT
===================================================== */

let latestResult = null;


/* =====================================================
   INITIALIZATION
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateLocationCount();

        updateStateMetric();

        attachCheckboxEvents();

    }
);


/* =====================================================
   CHECKBOX EVENTS
===================================================== */

function attachCheckboxEvents() {

    const checkboxes =
        document.querySelectorAll(
            ".location-row input"
        );


    checkboxes.forEach(
        checkbox => {

            checkbox.addEventListener(
                "change",
                () => {

                    updateLocationCount();

                    updateStateMetric();

                }
            );

        }
    );

}


/* =====================================================
   GET SELECTED LOCATIONS
===================================================== */

function getSelectedLocations() {

    const checked =
        document.querySelectorAll(
            ".location-row input:checked"
        );


    return Array.from(checked)
        .map(
            checkbox =>
                Number(checkbox.value)
        );

}


/* =====================================================
   UPDATE LOCATION COUNT
===================================================== */

function updateLocationCount() {

    const selected =
        getSelectedLocations();


    document.getElementById(
        "selectedCount"
    ).textContent =
        `${selected.length} / ${locations.length}`;


    document.getElementById(
        "vertexMetric"
    ).textContent =
        selected.length;

}


/* =====================================================
   UPDATE DP STATE COUNT
===================================================== */

function updateStateMetric() {

    const n =
        getSelectedLocations().length;


    if (n === 0) {

        document.getElementById(
            "stateMetric"
        ).textContent = "0";

        return;

    }


    const states =
        Math.pow(2, n) * n;


    document.getElementById(
        "stateMetric"
    ).textContent =
        states;


    document.getElementById(
        "dpStates"
    ).textContent =
        `2${superscript(n)} × ${n}`;

}


/* =====================================================
   SUPERSCRIPT
===================================================== */

function superscript(number) {

    const chars = {
        "0": "⁰",
        "1": "¹",
        "2": "²",
        "3": "³",
        "4": "⁴",
        "5": "⁵",
        "6": "⁶",
        "7": "⁷",
        "8": "⁸",
        "9": "⁹"
    };


    return String(number)
        .split("")
        .map(
            char => chars[char]
        )
        .join("");

}


/* =====================================================
   BITMASK HELPERS
===================================================== */


/*
    Check whether vertex v
    is present in mask.
*/

function isVisited(mask, v) {

    return (
        mask &
        (1 << v)
    ) !== 0;

}


/*
    Add vertex v to mask.
*/

function addToMask(mask, v) {

    return (
        mask |
        (1 << v)
    );

}


/*
    Convert mask to binary.
*/

function maskToBinary(
    mask,
    n
) {

    return mask
        .toString(2)
        .padStart(n, "0");

}


/* =====================================================
   TSP BITMASK DP
===================================================== */

function solveTSP(
    selectedNodes,
    startNode
) {

    /*
        Number of selected locations
    */

    const n =
        selectedNodes.length;


    /*
        Local index mapping

        Example:

        selectedNodes =
        [0, 2, 3, 4]

        local 0 -> Hyderabad
        local 1 -> Kukatpally
        local 2 -> Madhapur
        local 3 -> Gachibowli
    */

    const localToGlobal =
        selectedNodes;


    const globalToLocal = {};


    selectedNodes.forEach(
        (globalNode, index) => {

            globalToLocal[
                globalNode
            ] = index;

        }
    );


    const start =
        globalToLocal[startNode];


    /*
        Total possible masks
    */

    const totalMasks =
        1 << n;


    /*
        DP table

        dp[mask][i]

        = minimum cost to reach
          node i after visiting
          exactly the vertices
          represented by mask.
    */

    const dp =
        Array.from(
            {
                length: totalMasks
            },
            () =>
                Array(n).fill(
                    Infinity
                )
        );


    /*
        Parent table

        Used for route reconstruction.
    */

    const parent =
        Array.from(
            {
                length: totalMasks
            },
            () =>
                Array(n).fill(
                    -1
                )
        );


    /*
        State log for UI
    */

    const stateLog = [];


    /*
        Initial state

        Only starting node visited.
    */

    const initialMask =
        1 << start;


    dp[initialMask][start] = 0;


    stateLog.push({

        mask:
            initialMask,

        current:
            start,

        cost: 0

    });


    /*
        ==============================================
        DP TRANSITION
        ==============================================

        For every state:

        dp[mask][current]

        Try moving to every unvisited node.
    */

    for (
        let mask = 0;
        mask < totalMasks;
        mask++
    ) {

        for (
            let current = 0;
            current < n;
            current++
        ) {

            /*
                Ignore impossible states.
            */

            if (
                dp[mask][current] ===
                Infinity
            ) {

                continue;

            }


            /*
                Current vertex must
                be included in mask.
            */

            if (
                !isVisited(
                    mask,
                    current
                )
            ) {

                continue;

            }


            /*
                Try every next vertex.
            */

            for (
                let next = 0;
                next < n;
                next++
            ) {

                /*
                    Skip already visited.
                */

                if (
                    isVisited(
                        mask,
                        next
                    )
                ) {

                    continue;

                }


                /*
                    Global graph vertices.
                */

                const currentGlobal =
                    localToGlobal[
                        current
                    ];


                const nextGlobal =
                    localToGlobal[
                        next
                    ];


                /*
                    Edge weight.
                */

                const edgeCost =
                    distanceMatrix[
                        currentGlobal
                    ][
                        nextGlobal
                    ];


                /*
                    New mask.
                */

                const newMask =
                    addToMask(
                        mask,
                        next
                    );


                /*
                    New DP cost.
                */

                const newCost =
                    dp[mask][current] +
                    edgeCost;


                /*
                    RELAXATION

                    If the new state
                    is cheaper, update it.
                */

                if (
                    newCost <
                    dp[newMask][next]
                ) {

                    dp[newMask][next] =
                        newCost;


                    parent[newMask][next] =
                        current;


                    /*
                        Log state
                        for visualization.
                    */

                    stateLog.push({

                        mask:
                            newMask,

                        current:
                            next,

                        cost:
                            newCost

                    });

                }

            }

        }

    }


    /*
        ==============================================
        FINAL TSP STATE
        ==============================================
    */

    const fullMask =
        totalMasks - 1;


    let minimumCost =
        Infinity;


    let finalNode =
        -1;


    /*
        Every vertex has been visited.

        Now return to the start.
    */

    for (
        let current = 0;
        current < n;
        current++
    ) {

        if (
            current === start
        ) {

            continue;

        }


        if (
            dp[fullMask][current] ===
            Infinity
        ) {

            continue;

        }


        const currentGlobal =
            localToGlobal[
                current
            ];


        const startGlobal =
            localToGlobal[
                start
            ];


        const returnCost =
            distanceMatrix[
                currentGlobal
            ][
                startGlobal
            ];


        const tourCost =
            dp[fullMask][current] +
            returnCost;


        if (
            tourCost <
            minimumCost
        ) {

            minimumCost =
                tourCost;

            finalNode =
                current;

        }

    }


    /*
        ==============================================
        ROUTE RECONSTRUCTION
        ==============================================
    */

    const route = [];


    let mask =
        fullMask;


    let current =
        finalNode;


    while (
        current !== -1
    ) {

        route.unshift(
            localToGlobal[
                current
            ]
        );


        const previous =
            parent[mask][current];


        mask =
            mask ^
            (1 << current);


        current =
            previous;

    }


    /*
        Add starting node at
        the beginning if required.
    */

    if (
        route[0] !==
        localToGlobal[start]
    ) {

        route.unshift(
            localToGlobal[start]
        );

    }


    /*
        Return to starting point.
    */

    route.push(
        localToGlobal[start]
    );


    return {

        cost:
            minimumCost,

        route,

        stateLog,

        totalMasks,

        fullMask,

        statesPossible:
            totalMasks * n

    };

}


/* =====================================================
   MAIN OPTIMIZATION
===================================================== */

function optimizeRoute() {

    const selectedNodes =
        getSelectedLocations();


    const startNode =
        Number(
            document.getElementById(
                "startNode"
            ).value
        );


    /*
        Validation
    */

    if (
        selectedNodes.length < 3
    ) {

        alert(
            "Select at least 3 locations for route optimization."
        );

        return;

    }


    if (
        !selectedNodes.includes(
            startNode
        )
    ) {

        alert(
            "The start location must be selected."
        );

        return;

    }


    /*
        Clear previous graph.
    */

    clearGraph();


    /*
        Run Bitmask DP.
    */

    const result =
        solveTSP(
            selectedNodes,
            startNode
        );


    latestResult =
        result;


    /*
        Update all UI sections.
    */

    updateResultCards(
        result,
        selectedNodes
    );


    updateRouteGraph(
        result.route
    );


    updateDPTable(
        result,
        selectedNodes
    );

}


/* =====================================================
   UPDATE RESULT CARDS
===================================================== */

function updateResultCards(
    result,
    selectedNodes
) {

    /*
        Cost metric
    */

    document.getElementById(
        "costMetric"
    ).textContent =
        result.cost + " km";


    document.getElementById(
        "largeCost"
    ).textContent =
        result.cost;


    /*
        States explored
    */

    document.getElementById(
        "statesExplored"
    ).textContent =
        result.stateLog.length;


    /*
        Final mask
    */

    const mask =
        maskToBinary(
            result.fullMask,
            selectedNodes.length
        );


    document.getElementById(
        "finalMask"
    ).textContent =
        mask;


    document.getElementById(
        "maskBits"
    ).textContent =
        mask;


    /*
        Route output
    */

    const routeOutput =
        document.getElementById(
            "routeOutput"
        );


    const routeHTML =
        result.route
            .map(
                (node, index) => {

                    const location =
                        locations[node];


                    const item =
                        `<span class="route-location">
                            ${location}
                         </span>`;


                    if (
                        index <
                        result.route.length - 1
                    ) {

                        return (
                            item +
                            `<span class="route-arrow">
                                →
                             </span>`
                        );

                    }


                    return item;

                }
            )
            .join("");


    routeOutput.innerHTML = `

        <div class="route-path">
            ${routeHTML}
        </div>

        <div class="route-total">

            Minimum tour cost:

            <strong>
                ${result.cost} km
            </strong>

        </div>

    `;

}


/* =====================================================
   GRAPH VISUALIZATION
===================================================== */

function updateRouteGraph(route) {

    /*
        Activate every node
        belonging to optimal route.
    */

    route.forEach(
        (node, index) => {

            const element =
                document.getElementById(
                    "node-" + node
                );


            if (!element) {
                return;
            }


            element.classList.add(
                "active"
            );


            if (
                index === 0
            ) {

                element.classList.add(
                    "start"
                );

            }

        }
    );


    /*
        Activate route edges.
    */

    for (
        let i = 0;
        i < route.length - 1;
        i++
    ) {

        const a =
            route[i];

        const b =
            route[i + 1];


        highlightEdge(
            a,
            b
        );

    }

}


/* =====================================================
   EDGE HIGHLIGHT
===================================================== */

function highlightEdge(
    a,
    b
) {

    const id1 =
        `edge-${a}-${b}`;


    const id2 =
        `edge-${b}-${a}`;


    let edge =
        document.getElementById(
            id1
        );


    if (!edge) {

        edge =
            document.getElementById(
                id2
            );

    }


    if (edge) {

        edge.classList.add(
            "active"
        );

    }

}


/* =====================================================
   DP TABLE
===================================================== */

function updateDPTable(
    result,
    selectedNodes
) {

    const table =
        document.getElementById(
            "dpTable"
        );


    table.innerHTML = "";


    /*
        Display a useful subset
        of the state-space rather
        than thousands of rows.
    */

    const displayStates =
        result.stateLog.slice(
            0,
            12
        );


    displayStates.forEach(
        (state, index) => {

            const globalNode =
                selectedNodes[
                    state.current
                ];


            const visited = [];


            selectedNodes.forEach(
                (globalNode, localIndex) => {

                    if (
                        isVisited(
                            state.mask,
                            localIndex
                        )
                    ) {

                        visited.push(
                            locations[
                                globalNode
                            ]
                        );

                    }

                }
            );


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td class="mask-cell">
                    ${maskToBinary(
                        state.mask,
                        selectedNodes.length
                    )}
                </td>

                <td>
                    ${visited.join(", ")}
                </td>

                <td>
                    ${locations[
                        globalNode
                    ]}
                </td>

                <td class="cost-cell">
                    ${state.cost} km
                </td>

            `;


            table.appendChild(
                row
            );

        }
    );

}


/* =====================================================
   CLEAR GRAPH
===================================================== */

function clearGraph() {

    document
        .querySelectorAll(
            ".graph-node"
        )
        .forEach(
            node => {

                node.classList.remove(
                    "active",
                    "start"
                );

            }
        );


    document
        .querySelectorAll(
            "#edges line"
        )
        .forEach(
            edge => {

                edge.classList.remove(
                    "active"
                );

            }
        );

}


/* =====================================================
   RESET
===================================================== */

function resetApplication() {

    latestResult =
        null;


    clearGraph();


    document.getElementById(
        "costMetric"
    ).textContent =
        "--";


    document.getElementById(
        "largeCost"
    ).textContent =
        "--";


    document.getElementById(
        "statesExplored"
    ).textContent =
        "--";


    document.getElementById(
        "finalMask"
    ).textContent =
        "--";


    document.getElementById(
        "maskBits"
    ).textContent =
        "000000";


    document.getElementById(
        "routeOutput"
    ).innerHTML = `

        <div class="empty-state">

            <span>∑</span>

            <p>
                Run the optimization algorithm
                to generate the optimal route.
            </p>

        </div>

    `;


    document.getElementById(
        "dpTable"
    ).innerHTML = `

        <tr>

            <td colspan="5">
                Run optimization to populate
                DP states.
            </td>

        </tr>

    `;

}


/* =====================================================
   START LOCATION CHANGE
===================================================== */

document
    .getElementById(
        "startNode"
    )
    .addEventListener(
        "change",
        () => {

            const selected =
                getSelectedLocations();


            updateLocationCount();

            updateStateMetric();

        }
    );
    
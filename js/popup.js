// Parsing page HTML
var documentHTML;

chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action == "getSource") {
        documentHTML = request.source;
        var bodyHtml = /<body.*?>([\s\S]*)<\/body>/.exec(documentHTML)[1];
        var SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
        while (SCRIPT_REGEX.test(bodyHtml)) {
            bodyHtml = bodyHtml.replace(SCRIPT_REGEX, " ");
        }
        bodyHTML = bodyHtml.replace(/(?:https?|ftp):\/\/[\n\S]+/g, ' ');
        let plainText = bodyHtml.replace(/<[^>]+>/g, ' ');
        plainText = plainText.replace(/[\u2000-\u206F\u2E00-\u2E7F\\'©!"#$%&()*+\-\/:;<=>?@\[\]^_`{|}~]/g, ' ');
        plainText = plainText.replace(/\s+/g,' ').trim();
        console.log(plainText);
        var body = JSON.stringify(
            {
                "documents": [
                    {
                        "language": "en",
                        "id": "1",
                        "text": plainText
                    }
                ]
            }
        );
        textAnalytics(body);
    }
});

function textAnalytics(body) {
    $(function() {
        var params = {
            // Request parameters
            "showStats": true,
        };
      
        $.ajax({
            url: "https://westus2.api.cognitive.microsoft.com/text/analytics/v2.1/keyPhrases?" + $.param(params),
            beforeSend: function(xhrObj){
                // Request headers
                xhrObj.setRequestHeader("Content-Type","application/json");
                xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key","a581fc99482c42b9b1395425fcde4e37");
            },
            type: "POST",
            // Request body
            data: body,
        })
        .done(function(data) {
            alert("success");
            console.log(data);
        })
        .fail(function() {
            alert("error");
        });
    });
}

function onWindowLoad() {
    chrome.tabs.executeScript(null, {
        file: "js/getPagesSource.js"
    }, function() {
        // If you try and inject into an extensions page or the webstore/NTP you'll get an error
        if (chrome.runtime.lastError) {
            console.log('There was an error injecting script : \n' + chrome.runtime.lastError.message);
        }
    });

}

window.onload = onWindowLoad;

// Highlighting 

function highlightKeywords() {
    chrome.tabs.executeScript(null, {
        file: "js/highlight.js"
    }, function() {
        // If you try and inject into an extensions page or the webstore/NTP you'll get an error
        if (chrome.runtime.lastError) {
            console.log('There was an error injecting script : \n' + chrome.runtime.lastError.message);
        }
    });

}

highlightKeywords();

// Create the bias scale
document.addEventListener('DOMContentLoaded', function() {
    var colorA = "blue", colorB = "red";
    drawScale("seq1", d3.interpolate(colorA, colorB));
})

function drawScale(id, interpolator) {
    var data = Array.from(Array(100).keys());

    var cScale = d3.scaleSequential()
        .interpolator(interpolator)
        .domain([0,99]);

    var xScale = d3.scaleLinear()
        .domain([0,99])
        .range([0, 580]);

    var u = d3.select("#" + id)
        .selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", (d) => Math.floor(xScale(d)))
        .attr("y", 0)
        .attr("height", 40)
        .attr("width", (d) => {
            if (d == 99) {
                return 6;
            }
            return Math.floor(xScale(d+1)) - Math.floor(xScale(d)) + 1;
         })
        .attr("fill", (d) => cScale(d));
  }
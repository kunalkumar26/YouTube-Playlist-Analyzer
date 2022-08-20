const puppeteer = require("puppeteer");
let page;

(async function(){
    // launching puppeteer
    let browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ["--start-fullscreen"]
    });
    // opening new page
    page = await browser.newPage();
    await page.goto("https://www.youtube.com/playlist?list=PLRBp0Fe2GpgnIh0AiYKh7o7HnYAej-5ph");
    // fetching name of the playlist
    await page.waitForSelector('h1[id="title"]')
    let element = await page.$('h1[id="title"]')
    // evaluate function
    let value = await page.evaluate(el => el.textContent, element)
    // let value = await page.evaluate(
    //     function (ele){
    //         return ele.textContent;
    //     },
    //     element
    // )
    value = value.split("|")[0];
    console.log("Title:",value);

    // selecting element from array of elements
    // fetching no of videos
    await page.waitForSelector('.style-scope.ytd-playlist-sidebar-primary-info-renderer');
    arr = await page.$$('.style-scope.ytd-playlist-sidebar-primary-info-renderer');
    element = arr[5];
    let videos = await page.evaluate(el => el.textContent, element);
    console.log("Videos:",videos);

    // fetching no of views
    await page.waitForSelector('.style-scope.ytd-playlist-sidebar-primary-info-renderer');
    arr = await page.$$('.style-scope.ytd-playlist-sidebar-primary-info-renderer');
    element = arr[6];
    value = await page.evaluate(el => el.textContent, element);
    console.log("Views:",value);

    videos = videos.split(" ")[0];
    let vidCount = videos.split(",")
    videos = "";
    for(let i=0; i<vidCount.length; i++){
        videos += vidCount[i];
    }
    let loopcount = Math.floor(videos/100);
    // console.log(loopcount);

    //circle style-scope tp-yt-paper-spinner
    for(let i=0; i<loopcount; i++){
        // load start
        await page.click(".circle.style-scope.tp-yt-paper-spinner")
        // load finish
        await waitTillHTMLRendered(page);
        // console.log("loaded the new videos");
    }
    // going to the last video
    let videoNameElementList = await page.$$('a[id="video-title"]');
    let lastVideo = videoNameElementList[videoNameElementList.length-1];
    await page.evaluate(function (elem){
        elem.scrollIntoView();
    }, lastVideo);

    arr = [];
    // fetching all videos and times
    await page.waitForSelector('a[id="video-title"]');
    arrVidName = await page.$$('a[id="video-title"]');
    arrVidDur = await page.$$('span[id="text"]');
    // console.log("#vids", arrVidName.length);
    // console.log("#time", arrVidDur.length);
    let len = 0;
    for(let i=0; i<arrVidName.length; i++){
        // video at index 689 is a livestream hence do not have any time.
        if(i <= 688){
            eleVidName = arrVidName[i];
            eleVidDur = arrVidDur[i];
            let vidName = await page.evaluate(el => el.textContent, eleVidName);
            vidName = vidName.trim();
            let vidDur = await page.evaluate(el => el.textContent, eleVidDur);
            vidDur = vidDur.trim();
            let vidDurParts = vidDur.split(":");
            let p = 0;
            for(let i=vidDurParts.length-1; i>=0; i--){
                len += vidDurParts[i]*Math.pow(60, p);
                p++;
            }
            arr.push({vidName, vidDur});
        } else if(i>=690) {
            eleVidName = arrVidName[i];
            eleVidDur = arrVidDur[i-1];
            let vidName = await page.evaluate(el => el.textContent, eleVidName);
            vidName = vidName.trim();
            let vidDur = await page.evaluate(el => el.textContent, eleVidDur);
            vidDur = vidDur.trim();
            let vidDurParts = vidDur.split(":");
            let p = 0;
            for(let i=vidDurParts.length-1; i>=0; i--){
                len += vidDurParts[i]*Math.pow(60, p);
                p++;
            }
            arr.push({vidName, vidDur});
        }

    }

    console.table(arr);
    // no of hours
    len = len/3600;
    console.log("Total Hours:", len);
    // average hours
    let averageHours = len/arrVidDur.length;
    console.log("Average Time:", averageHours);
    // @ 1.25
    console.log("Hours @ 1.25:", len/1.25);
    // @ 1.5
    console.log("Hours @ 1.50:", len/1.5);
    // @ 1.75
    console.log("Hours @ 1.75:", len/1.75);
    // @ 2.0
    console.log("Hours @ 2:", len/2);

})();

// this code is comparing the size of the html @ different times
// if size changed it means new content is loaded
// is size remains same for some time it means the page is loaded completely.
const waitTillHTMLRendered = async (page, timeout = 10000) => {
    const checkDurationMsecs = 1000;
    const maxChecks = timeout / checkDurationMsecs;
    let lastHTMLSize = 0;
    let checkCounts = 1;
    let countStableSizeIterations = 0;
    const minStableSizeIterations = 3;
    while (checkCounts++ <= maxChecks) {
        // html
        let html = await page.content();
        let currentHTMLSize = html.length;
        // body part
        // console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize);
        if (lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize)
            countStableSizeIterations++;
        else
            countStableSizeIterations = 0; //reset the counter

        if (countStableSizeIterations >= minStableSizeIterations) {
            // console.log("Page rendered fully..");
            break;
        }
        lastHTMLSize = currentHTMLSize;
        await page.waitFor(checkDurationMsecs);
    }
};

//circle style-scope tp-yt-paper-spinner
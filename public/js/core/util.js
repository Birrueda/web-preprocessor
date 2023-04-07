/*
*   Miscellaneous methods that we often use
*/

var mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Returns user agent check for mobile devices
function isMobile()
{
    return mobileUserAgent;
}

function getMinSize() {    
    return 1500;
}

function getWidth() {    
    return 640;
}

function getHeight() {    
    return 480;
}

function getFrameSkip() {    
    return 1;
}
import{r as it,a3 as st}from"./index-Dxqb2iSK.js";var Q={exports:{}};(function(Z,ct){(function(G,I){Z.exports=I(it)})(typeof self<"u"?self:st,function(G){return function(){var I={155:function(t){t.exports=G}},V={};function S(t){var e=V[t];if(e!==void 0)return e.exports;var r=V[t]={exports:{}};return I[t](r,r.exports,S),r.exports}S.d=function(t,e){for(var r in e)S.o(e,r)&&!S.o(t,r)&&Object.defineProperty(t,r,{enumerable:!0,get:e[r]})},S.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},S.r=function(t){typeof Symbol<"u"&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})};var M={};S.r(M),S.d(M,{useReactToPrint:function(){return nt}});var tt=S(155);const Y="printWindow";function m({level:t="error",messages:e,suppressErrors:r=!1}){r||(t==="error"?console.error(e):t==="warning"?console.warn(e):console.debug(e))}function _(t,e){if(e||!t){const r=document.getElementById(Y);r&&document.body.removeChild(r)}}function O(t){return t instanceof Error?t:new Error("Unknown Error")}function U(t,e){const{documentTitle:r,onAfterPrint:c,onPrintError:g,preserveAfterPrint:f,print:k,suppressErrors:b}=e;setTimeout(()=>{var d,h;if(t.contentWindow){let C=function(){c==null||c(),_(f)};if(t.contentWindow.focus(),k)k(t).then(C).catch(y=>{g?g("print",O(y)):m({messages:["An error was thrown by the specified `print` function"],suppressErrors:b})});else{if(t.contentWindow.print){const y=(h=(d=t.contentDocument)===null||d===void 0?void 0:d.title)!==null&&h!==void 0?h:"",x=t.ownerDocument.title;r&&(t.ownerDocument.title=r,t.contentDocument&&(t.contentDocument.title=r)),t.contentWindow.print(),r&&(t.ownerDocument.title=x,t.contentDocument&&(t.contentDocument.title=y))}else m({messages:["Printing for this browser is not currently possible: the browser does not have a `print` method available for iframes."],suppressErrors:b});[/Android/i,/webOS/i,/iPhone/i,/iPad/i,/iPod/i,/BlackBerry/i,/Windows Phone/i].some(y=>{var x,W;return((W=(x=navigator.userAgent)!==null&&x!==void 0?x:navigator.vendor)!==null&&W!==void 0?W:"opera"in window&&window.opera).match(y)})?setTimeout(C,500):C()}}else m({messages:["Printing failed because the `contentWindow` of the print iframe did not load. This is possibly an error with `react-to-print`. Please file an issue: https://github.com/MatthewHerbst/react-to-print/issues/"],suppressErrors:b})},500)}function J(t){const e=[],r=document.createTreeWalker(t,NodeFilter.SHOW_ELEMENT,null);let c=r.nextNode();for(;c;)e.push(c),c=r.nextNode();return e}function K(t,e,r){const c=J(t),g=J(e);if(c.length===g.length)for(let f=0;f<c.length;f++){const k=c[f],b=g[f],d=k.shadowRoot;if(d!==null){const h=b.attachShadow({mode:d.mode});h.innerHTML=d.innerHTML,K(d,h,r)}}else m({messages:["When cloning shadow root content, source and target elements have different size. `onBeforePrint` likely resolved too early.",t,e],suppressErrors:r})}const et=`
    @page {
        /* Remove browser default header (title) and footer (url) */
        margin: 0;
    }
    @media print {
        body {
            /* Tell browsers to print background colors */
            color-adjust: exact; /* Firefox. This is an older version of "print-color-adjust" */
            print-color-adjust: exact; /* Firefox/Safari */
            -webkit-print-color-adjust: exact; /* Chrome/Safari/Edge/Opera */
        }
    }
`;function ot(t,e,r,c){var g,f,k,b,d;const{contentNode:h,clonedContentNode:C,clonedImgNodes:y,clonedVideoNodes:x,numResourcesToLoad:W,originalCanvasNodes:j}=r,{bodyClass:q,fonts:z,ignoreGlobalStyles:H,pageStyle:N,nonce:A,suppressErrors:F,copyShadowRoots:B}=c;t.onload=null;const n=(g=t.contentDocument)!==null&&g!==void 0?g:(f=t.contentWindow)===null||f===void 0?void 0:f.document;if(n){const l=n.body.appendChild(C);B&&K(h,l,!!F),z&&(!((k=t.contentDocument)===null||k===void 0)&&k.fonts&&(!((b=t.contentWindow)===null||b===void 0)&&b.FontFace)?z.forEach(i=>{const o=new FontFace(i.family,i.source,{weight:i.weight,style:i.style});t.contentDocument.fonts.add(o),o.loaded.then(()=>{e(o)}).catch(p=>{e(o,["Failed loading the font:",o,"Load error:",O(p)])})}):(z.forEach(i=>{e(i)}),m({messages:['"react-to-print" is not able to load custom fonts because the browser does not support the FontFace API but will continue attempting to print the page'],suppressErrors:F})));const D=N??et,E=n.createElement("style");A&&(E.setAttribute("nonce",A),n.head.setAttribute("nonce",A)),E.appendChild(n.createTextNode(D)),n.head.appendChild(E),q&&n.body.classList.add(...q.split(" "));const L=n.querySelectorAll("canvas");for(let i=0;i<j.length;++i){const o=j[i],p=L[i];if(p===void 0){m({messages:["A canvas element could not be copied for printing, has it loaded? `onBeforePrint` likely resolved too early.",o],suppressErrors:F});continue}const s=p.getContext("2d");s&&s.drawImage(o,0,0)}for(let i=0;i<y.length;i++){const o=y[i],p=o.getAttribute("src");if(p){const s=new Image;s.onload=()=>{e(o)},s.onerror=(a,u,P,v,T)=>{e(o,["Error loading <img>",o,"Error",T])},s.src=p}else e(o,['Found an <img> tag with an empty "src" attribute. This prevents pre-loading it.',o])}for(let i=0;i<x.length;i++){const o=x[i];o.preload="auto";const p=o.getAttribute("poster");if(p){const s=new Image;s.onload=()=>{e(o)},s.onerror=(a,u,P,v,T)=>{e(o,["Error loading video poster",p,"for video",o,"Error:",T])},s.src=p}else o.readyState>=2?e(o):o.src?(o.onloadeddata=()=>{e(o)},o.onerror=(s,a,u,P,v)=>{e(o,["Error loading video",o,"Error",v])},o.onstalled=()=>{e(o,["Loading video stalled, skipping",o])}):e(o,["Error loading video, `src` is empty",o])}const $="select",w=h.querySelectorAll($),R=n.querySelectorAll($);for(let i=0;i<w.length;i++)R[i].value=w[i].value;if(!H){const i=document.querySelectorAll("style, link[rel~='stylesheet'], link[as='style']");for(let o=0,p=i.length;o<p;++o){const s=i[o];if(s.tagName.toLowerCase()==="style"){const a=n.createElement(s.tagName),u=s.sheet;if(u){let P="";try{const v=u.cssRules.length;for(let T=0;T<v;++T)typeof u.cssRules[T].cssText=="string"&&(P+=`${u.cssRules[T].cssText}\r
`)}catch(v){m({messages:["A stylesheet could not be accessed. This is likely due to the stylesheet having cross-origin imports, and many browsers block script access to cross-origin stylesheets. See https://github.com/MatthewHerbst/react-to-print/issues/429 for details. You may be able to load the sheet by both marking the stylesheet with the cross `crossorigin` attribute, and setting the `Access-Control-Allow-Origin` header on the server serving the stylesheet. Alternatively, host the stylesheet on your domain to avoid this issue entirely.",s,`Original error: ${O(v).message}`],level:"warning"})}a.setAttribute("id",`react-to-print-${o}`),A&&a.setAttribute("nonce",A),a.appendChild(n.createTextNode(P)),n.head.appendChild(a)}}else if(s.getAttribute("href"))if(s.hasAttribute("disabled"))m({messages:["`react-to-print` encountered a <link> tag with a `disabled` attribute and will ignore it. Note that the `disabled` attribute is deprecated, and some browsers ignore it. You should stop using it. https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#attr-disabled. The <link> is:",s],level:"warning"}),e(s);else{const a=n.createElement(s.tagName);for(let u=0,P=s.attributes.length;u<P;++u){const v=s.attributes[u];v&&a.setAttribute(v.nodeName,(d=v.nodeValue)!==null&&d!==void 0?d:"")}a.onload=()=>{e(a)},a.onerror=(u,P,v,T,rt)=>{e(a,["Failed to load",a,"Error:",rt])},A&&a.setAttribute("nonce",A),n.head.appendChild(a)}else m({messages:["`react-to-print` encountered a <link> tag with an empty `href` attribute. In addition to being invalid HTML, this can cause problems in many browsers, and so the <link> was not loaded. The <link> is:",s],level:"warning"}),e(s)}}}W===0&&U(t,c)}function nt({bodyClass:t,contentRef:e,copyShadowRoots:r,documentTitle:c,fonts:g,ignoreGlobalStyles:f,nonce:k,onAfterPrint:b,onBeforePrint:d,onPrintError:h,pageStyle:C,preserveAfterPrint:y,print:x,printIframeProps:W,suppressErrors:j}){return(0,tt.useCallback)(z=>{function H(){const N={bodyClass:t,contentRef:e,copyShadowRoots:r,documentTitle:c,fonts:g,ignoreGlobalStyles:f,nonce:k,onAfterPrint:b,onPrintError:h,pageStyle:C,preserveAfterPrint:y,print:x,suppressErrors:j},A=function(n){const l=document.createElement("iframe");return l.width=`${document.documentElement.clientWidth}px`,l.height=`${document.documentElement.clientHeight}px`,l.style.position="absolute",l.style.top=`-${document.documentElement.clientHeight+100}px`,l.style.left=`-${document.documentElement.clientWidth+100}px`,l.id=Y,l.srcdoc="<!DOCTYPE html>",n&&(n.allow&&(l.allow=n.allow),n.referrerPolicy!==void 0&&(l.referrerPolicy=n.referrerPolicy),n.sandbox!==void 0&&(l.sandbox=n.sandbox)),l}(W),F=function(n,l){const{contentRef:D,fonts:E,ignoreGlobalStyles:L,suppressErrors:$}=l,w=function({contentRef:a,optionalContent:u,suppressErrors:P}){return u&&typeof u=="function"?(a&&m({level:"warning",messages:['"react-to-print" received a `contentRef` option and an optional-content param passed to its callback. The `contentRef` option will be ignored.']}),u()):a?a.current:void m({messages:['"react-to-print" did not receive a `contentRef` option or a optional-content param pass to its callback.'],suppressErrors:P})}({contentRef:D,optionalContent:n,suppressErrors:$});if(!w)return;const R=w.cloneNode(!0),i=document.querySelectorAll("link[rel~='stylesheet'], link[as='style']"),o=R.querySelectorAll("img"),p=R.querySelectorAll("video"),s=E?E.length:0;return{contentNode:w,clonedContentNode:R,clonedImgNodes:o,clonedVideoNodes:p,numResourcesToLoad:(L?0:i.length)+o.length+p.length+s,originalCanvasNodes:w.querySelectorAll("canvas")}}(z,N);if(!F)return void m({messages:["There is nothing to print"],suppressErrors:j});const B=function(n,l,D){const{suppressErrors:E}=n,L=[],$=[];return function(w,R){L.includes(w)?m({level:"debug",messages:["Tried to mark a resource that has already been handled",w],suppressErrors:E}):(R?(m({messages:['"react-to-print" was unable to load a resource but will continue attempting to print the page',...R],suppressErrors:E}),$.push(w)):L.push(w),L.length+$.length===l&&U(D,n))}}(N,F.numResourcesToLoad,A);(function(n,l,D,E){n.onload=()=>{ot(n,l,D,E)},document.body.appendChild(n)})(A,B,F,N)}_(y,!0),d?d().then(()=>{H()}).catch(N=>{h==null||h("onBeforePrint",O(N))}):H()},[t,e,r,c,g,f,k,b,d,h,C,y,x,j])}return M}()})})(Q);var pt=Q.exports;const X=`
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #111111 !important;
  }
  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .kot-print,
  #kot-print,
  #bill-print {
    background: #ffffff !important;
    color: #111111 !important;
  }
  .kot-print *,
  #kot-print *,
  #bill-print * {
    color: #111111 !important;
    background-color: transparent !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  .kot-print,
  #kot-print,
  #bill-print {
    background-color: #ffffff !important;
  }
  #bill-print th,
  #bill-print thead tr {
    background-color: #f5f5f5 !important;
  }
  #bill-print td,
  #bill-print th {
    border-color: #000000 !important;
  }
  .no-print {
    display: none !important;
  }
`,at=`
  .kot-print { width: 80mm !important; font-size: 10px !important; line-height: 1.25 !important; }
  .kot-print * { font-size: 10px !important; line-height: 1.25 !important; }
  .kot-print .kot-title { font-size: 14px !important; font-weight: 800 !important; }
  .kot-print .tight { margin: 4px 0 !important; padding: 0 !important; }
  .kot-print .section-gap { margin: 6px 0 !important; }
  .kot-print .border-dashed { border-color: #000 !important; }
  .kot-print .border-t {
    border-top-width: .5008px !important;
    border-top-style: dashed !important;
    border-top-color: #000 !important;
  }
  .kot-print .divider-dashed {
    border: 0 !important;
    height: 1px !important;
    background-image: repeating-linear-gradient(to right, #000 0, #000 8px, transparent 8px, transparent 12px) !important;
    background-repeat: repeat-x !important;
    background-size: 100% 1px !important;
    background-position: 0 .5008px !important;
  }
  .kot-print .number { margin: 0 !important; }
  .screen-compact {
    max-height: none !important;
    overflow: visible !important;
  }
`,lt=`
  #bill-print {
    width: 80mm !important;
    max-width: 80mm !important;
    margin: 0 auto !important;
    padding: 0 !important;
  }
  #bill-print h1 { font-size: 14px !important; }
  #bill-print h2 { font-size: 12px !important; }
  #bill-print h3, #bill-print p, #bill-print span { font-size: 10px !important; }
  #bill-print table { width: 100% !important; border-collapse: collapse !important; }
  #bill-print th, #bill-print td { padding: 4px 6px !important; }
  #bill-print th { font-weight: 600 !important; }
  #bill-print tr { page-break-inside: avoid; }
  #bill-print thead { display: table-header-group; }
  #bill-print tfoot { display: table-footer-group; }
`,ut=`
  @page { size: 80mm auto; margin: 4mm; }
  @media print {
    ${X}
    ${at}
  }
`,mt=`
  @page { size: 80mm auto; margin: 5mm 3mm; }
  @media print {
    ${X}
    ${lt}
  }
`;export{mt as b,ut as k,pt as l};

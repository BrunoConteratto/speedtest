/* JQUERY EXTENDS FUNCTIONS */
// form serialize
$.fn.serializeObject = function (sanitize = true, unmask = []) {
  const self = $(this);
  const disabled = self.find(':input:disabled').removeAttr('disabled');
  let data = {};

  $.each(this.serializeArray(), function () {
    let value = this.value !== undefined ? this.value : null;

    // sanitize
    if (sanitize && value) {
      const num = Number(value);
      if (!Number.isNaN(num)) {
        value = num;
      }
    }

    if (this.name.endsWith('[]')) {
      const key = this.name.slice(0, -2);
      if (!data[key]) data[key] = [];
      data[key].push(value);
    } else if (unmask === true || unmask.includes(this.name)) {
      data[this.name] = self.find(`[name=${this.name}]`).cleanVal();
    } else {
      data[this.name] = value;
    }
  });
  disabled.attr('disabled', 'disabled');
  return data;
};

const cipher = (salt) => {
  const textToChars = text => text.split('').map(c => c.charCodeAt(0));
  const byteHex = n => ("0" + Number(n).toString(16)).substr(-2);
  const applySaltToChar = code => textToChars(salt).reduce((a,b) => a ^ b, code);
  return text => text.split('')
    .map(textToChars)
    .map(applySaltToChar)
    .map(byteHex)
    .join('');
}
  
const decipher = (salt) => {
  const textToChars = text => text.split('').map(c => c.charCodeAt(0));
  const applySaltToChar = code => textToChars(salt).reduce((a,b) => a ^ b, code);
  return encoded => encoded.match(/.{1,2}/g)
    .map(hex => parseInt(hex, 16))
    .map(applySaltToChar)
    .map(charCode => String.fromCharCode(charCode))
    .join('');
}

let auxData = null;
let gauge = null;
const base_url = 'http://localhost:3333'

$( document ).ready(async function() {
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' });
  }

  var $gauge = $("#gauge");
  gauge = Gauge($gauge.get(0), {
    max: Math.log(10 * 1024 + 1),
    value: 0,
    showValue: false
  });

  var SPEEDTEST_SERVERS = [];
  await new Promise((resolve) => {
    $.getJSON('/public/servers.json', function(data) {
      SPEEDTEST_SERVERS = data;
      resolve();
    });
  });

  var s = new Speedtest();

  // s.loadServerList('/public/servers.json', function(servers) {
  //   SPEEDTEST_SERVERS = servers;
  // });
  s.addTestPoints(SPEEDTEST_SERVERS);
  // s.selectServer(function(server) {
  //   console.log(server);
  // });

  s.onupdate = function (data) {
    auxData = data;
    elements.result.removeClass('active');
    switch (data.testState) {
      case -1:
      case 0:
        break;
      case 1:
        setProgressBar(data.dlProgress, true);
        elements.download.addClass('active');
        elements.gaugeVal.text(data.dlStatus);
        gauge.setValue(Math.log(10 * data.dlStatus + 1));
        break;
      case 2:
        setProgressBar(data.pingProgress);
        elements.latency.addClass('active');
        elements.jitter.addClass('active');
        break;
      case 3:
        setProgressBar(data.ulProgress);
        elements.upload.addClass('active');
        elements.gaugeVal.text(data.ulStatus);
        gauge.setValue(Math.log(10 * data.ulStatus + 1));
        break;
      default:
        break;
    }

    elements.downloadVal.text(data.dlStatus);
    elements.uploadVal.text(data.ulStatus);
    elements.latencyVal.text(data.pingStatus);
    elements.jitterVal.text(data.jitterStatus);
    elements.ipVal.text(data.clientIp);
  }
  s.onend = function(aborted) {
    setProgressBar(0);
    auxData.date = new Date();
    const factory = cipher('123456');
    const code = factory(JSON.stringify(auxData));
    if (aborted) {
      ui.speedtest(false);
    } else {
      ui.speedtestDone(true);
      if (settings.saveResults === 'on') {
        results.push({
          date: auxData.date.toLocaleDateString(),
          download: auxData?.dlStatus,
          upload: auxData?.ulStatus,
          latency: auxData?.pingStatus,
          jitter: auxData?.jitterStatus,
          ipOrg: auxData?.clientIp,
          link: `${base_url}/result/${code}`,
        });
        localStorage.setItem('results', JSON.stringify(results || {}));
      };
    }
  }

  $('[open-section]').on('click', function (e) {
    e.preventDefault();
    if (s.getState() === 3) s.abort();
    const self = $(this);
    const section = self.attr('href');
  
    $('section').hide('fast');
    $(section).show('fast');

    loadHystoryTests();
  });
  
  const elements = {
    speedtest: $('#speedtest'),
    start: $('#start'),
    stop: $('#stop'),
    latency: $('#latency'),
    latencyVal: $('#latency .value'),
    jitter: $('#jitter'),
    jitterVal: $('#jitter .value'),
    download: $('#download'),
    downloadVal: $('#download .value'),
    upload: $('#upload'),
    uploadVal: $('#upload .value'),
    gauge: $('#gauge'),
    gaugeVal: $('#gauge .value'),
    ip: $('#ip'),
    ipVal: $('#ip .value'),
    org: $('#ip .org'),
    result: $('.result'),
    share: $('#share'),
    sharedata: $('#sharedata'),
    servers: $('[name=server]'),
  }
  
  const ui = {
    speedtest(show) {
      elements.speedtest.removeClass('done').addClass('ready');
      if (show) {
        elements.start.hide('fast');
        elements.stop.show('fast');
      } else {
        elements.stop.hide('fast');
        elements.start.show('fast');
      }
      elements.share.hide();
      elements.latency.toggle(show);
      elements.jitter.toggle(show);
      elements.download.toggle(show);
      elements.upload.toggle(show);
      elements.gauge.toggle(show);
      elements.ip.toggle(show);
    },
    speedtestDone(show) {
      if(show) {
        elements.speedtest.removeClass('ready').addClass('done');
        elements.stop.hide('fast');
        elements.start.show('fast');
        elements.gauge.hide();
        elements.share.show('fast');
      } else {
        elements.speedtest.removeClass('done').addClass('ready');
        elements.start.hide('fast');
        elements.stop.show('fast');
        elements.gauge.show();
        elements.share.hide('fast');
      }
    }
  }
  
  elements.start.on('click', () => {
    if (s.getState() === 2 || s.getState() === 4) {
      ui.speedtest(true);
      elements.downloadVal.text('');
      elements.uploadVal.text('');
      elements.latencyVal.text('');
      elements.jitterVal.text('');
      elements.ipVal.text('');
      elements.gaugeVal.text('...');
      gauge.setValue(0);
      s.start();
    }
  });
  
  elements.stop.on('click', () => {
    s.abort();
  });

  elements.share.on('click', () => {
    const factory = cipher('123456');
    const data = factory(JSON.stringify(auxData));
    showResult(data);
  });

  function showResult(data) {
    $('section').hide();
    elements.sharedata.show('fast');
    elements.sharedata.find('img').attr('src', `${base_url}/resultimg/${data}`);
    elements.sharedata.find('input[type=text]').eq(0).val(`${base_url}/result/${data}`);
    elements.sharedata.find('input[type=text]').eq(1).val(`${base_url}/resultimg/${data}`);
    elements.sharedata.find('input[type=text]').eq(2).val(`<a href="${base_url}/result/${data}"><img src="${base_url}/resultimg/${data}"></a>`);
    elements.sharedata.find('input[type=text]').eq(3).val(`[URL=${base_url}/result/${data}][IMG]${base_url}/resultimg/${data}[/IMG][/URL]`);
  }

  const $html = document.querySelector("html");
  const $themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const $body = document.querySelector("body");
  function setTheme(theme = 'light') {
    $html.classList[theme === "light" ? "add" : "remove"]("light");
    const [, r, g, b] = /([0-9]+), ?([0-9]+), ?([0-9]+)/.exec(
      window.getComputedStyle($body).getPropertyValue("background-color")
    );
    $themeColorMeta.setAttribute("content", rgbToHex(+r, +g, +b));
  }

  function rgbToHex(r = 255, g = 255, b = 255) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  const $speedtest = document.querySelector("#speedtest");
  const $progress = $speedtest.querySelector("#progress");
  const $progressBar = $speedtest.querySelector("#progress .progress-bar");
  function setProgressBar(progress, reverse = false) {
    $progress.style.flexDirection = reverse ? "row-reverse" : "row";
    $progressBar.style.width = progress * 100 + "%";
  }
  setProgressBar(0);

  $(document).on('submit', '#settings form', function (e) {
    e.preventDefault();
    const self = $(this);
    const data = self.serializeObject();
    localStorage.setItem('settings', JSON.stringify(data || {}));
    settings = data;
    setTimeout(() => {
      loadFormSettings();
      e.finish();
    }, 2000);
  });

  $(document).on('click', '#settings form button:eq(1)', function (e) {
    settings = {
      saveResults: 'on',
      conDownload: 6,
      conUpload: 3,
      getIP: "on",
      server: 0,
      testDl: "on",
      testPj: "on",
      testUl: "on",
      theme: "light",
      timeDownload: 15,
      timeUpload: 15,
    };
    loadFormSettings();
    $('#settings form button[type=submit]').trigger('click');
  });

  $(document).on('click', '#history button:eq(0)', function() {
    results = [];
    localStorage.setItem('results', JSON.stringify(results || {}));
    loadHystoryTests();
  });

  $(document).on('click', '[remove-history]', function() {
    const self = $(this);
    const index = self.attr('remove-history');
    results.splice(index, 1);
    localStorage.setItem('results', JSON.stringify(results || {}));
    loadHystoryTests();
  });

  $(document).on('click', '[link-history]', function() {
    const self = $(this);
    const index = self.attr('link-history');
    copyToClipboard(results[index].link);
    alert('Link copiado!');
  });

  function copyToClipboard(text) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(text).select();
    document.execCommand("copy");
    $temp.remove();
  }

  function loadFormSettings() {
    setTheme(settings.theme);
    Object.keys(settings).forEach((item) => {
      const el = $(`[name=${item}]`);
      if (el.attr('type') === 'checkbox') {
        el.prop('checked', settings?.[item] || false);  
      } else if (el.attr('type') === 'radio') {
        el.prop('checked', false);
        $(`[name=${item}][value=${settings?.[item]}]`).prop('checked', true);  
      } else {
        el.val(settings?.[item] || 0);
      }
    });

    elements.servers.val(settings.server || 0).change();

    s.setParameter('time_ul_max', settings.timeUpload || 15);
    s.setParameter('time_dl_max', settings.timeDownload || 15);
    s.setParameter('xhr_dlMultistream', settings.conDownload || 6);
    s.setParameter('xhr_ulMultistream', settings.conUpload || 3);
    let tests = '';
    if (settings.getIP === 'on') tests += 'I'
    if (settings.testPj === 'on') tests += 'P'
    if (settings.testDl === 'on') tests += '_D'
    if (settings.testUl === 'on') tests += '_U'

    s.setParameter('test_order', tests);
  }

  function loadHystoryTests() {
    const table = $('#history table');
    table.find('tbody').empty();
    results.forEach((item, i) => {
      table.append(`<tr><td>${item.date}</td><td>${item.latency} ms</td><td>${item.jitter} ms</td><td>${item.download} Mb/s</td><td>${item.upload} Mb/s</td><td>${item.ipOrg}</td><td><button remove-history="${i}" class="btn-danger"><i class="fas fa-minus-circle"></i></button><button link-history="${i}" class="btn-link"><i class="fas fa-link"></i></button></td></tr>`);
    });
  }

  SPEEDTEST_SERVERS.forEach((item, i) => {
    elements.servers.append($('<option>', {
      value: i,
      text: item.name,
    }));
  });

  let settings = JSON.parse(localStorage.getItem('settings')) || {
    saveResults: 'on',
    conDownload: 6,
    conUpload: 3,
    getIP: "on",
    server: 0,
    testDl: "on",
    testPj: "on",
    testUl: "on",
    theme: "light",
    timeDownload: 15,
    timeUpload: 15,
  };
  let results = JSON.parse(localStorage.getItem('results')) || [];

  s.selectServer(SPEEDTEST_SERVERS[settings.server || 0]);

  loadFormSettings();
  loadHystoryTests();

  const url = window.location.href;
  if (url.indexOf('/result') !== -1) {
    const code = url.split('result/')[1];
    // const factory = decipher('123456');
    // const data = JSON.parse(factory(code));
    showResult(code);
  }

  $(document).on('click', '[clickcopy]', function() {
    const input = $(this).parent().parent().find('input[type=text]');
    input.select();
    document.execCommand('copy');
  });

  $(document).on('submit', 'form', function (e) {
		const self = $(this);
    let btn = $(e.originalEvent.submitter);
    let content = btn.html();
    let btnAux = null;
    let contentAux = null;
    const inputs = self.find('input, textarea, button, select, .nav-item').not('[readonly]');
    const inputsFix = self.find('input[type="checkbox"], input[type="radio"], select').not('[readonly]');
		btn.html('<div class="row text-center m-t"><i class="fas fa-spinner fa-spin"></i></div>').attr('disabled', 'disabled');
		inputs.attr('readonly', true);
    inputsFix.attr('disabled', 'disabled');
		if (typeof self.checkValidity === 'function') self.checkValidity();
    e.button = (ref, loading = true) => {
      btnAux = typeof ref === 'string' ? $(ref) : ref;
      contentAux = btnAux.html();
      if (loading) {
        btnAux.html('<div class="row text-center m-t"><i class="fas fa-spinner fa-spin"></i></div>').attr('disabled', 'disabled');
        inputs.attr('readonly', true);
        inputsFix.attr('disabled', 'disabled');
      }
    }
		e.finish = () => {
			btn.html(content).removeAttr('disabled');
      btnAux && btnAux.html(contentAux).removeAttr('disabled');
			inputs.attr('readonly', false);
      inputsFix.removeAttr('disabled');
    }
  });
});




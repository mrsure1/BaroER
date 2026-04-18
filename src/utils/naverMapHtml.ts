import type { Hospital } from '@/src/types';

const statusColor = (s: Hospital['status']) => {
  if (s === 'AVAILABLE') return '#2E7D32';
  if (s === 'BUSY') return '#EF6C00';
  return '#C62828';
};

/**
 * 네이버 지도 JS v3 — 병원 위치·가용 병상 수를 한눈에 (임시: 카카오맵 승인 전)
 *
 * WebView에서는 head의 maps.js가 비동기로 로드되는 경우, 인라인 스크립트가 먼저 실행되어
 * `naver is not defined`로 지도가 안 그려질 수 있다. maps.js를 동적으로 넣고 `onload`에서만 초기화한다.
 */
export function buildNaverMapHtml(
  ncpClientId: string,
  userLat: number,
  userLng: number,
  hospitals: Hospital[]
): string {
  const payload = hospitals.map((h) => ({
    id: h.id,
    name: h.name,
    lat: h.lat,
    lng: h.lng,
    beds: h.availableBeds,
    color: statusColor(h.status),
  }));
  const dataJson = JSON.stringify(payload);
  const esc = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/</g, '\\u003c').replace(/'/g, "\\'").replace(/\r?\n/g, ' ');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    html, body, #map { width:100%; height:100%; margin:0; padding:0; overflow:hidden; background:#eef1f4; }
    .pin {
      display: flex; flex-direction: column; align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .pill {
      font-size: 11px; font-weight: 700; color: #1c1c1e;
      background: rgba(255,255,255,0.95); padding: 5px 9px; border-radius: 10px;
      border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 4px; max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .dot {
      width: 16px; height: 16px; border-radius: 50%; border: 2px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.22);
    }
    .meDot {
      width: 18px; height: 18px; border-radius: 50%; border: 3px solid #fff;
      background: #007AFF;
      box-shadow: 0 2px 10px rgba(0,122,255,0.45);
    }
    .mapError {
      padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px; color: #4b5563;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function () {
      var hospitals = ${dataJson};
      var centerLat = ${userLat};
      var centerLng = ${userLng};
      var clientId = '${esc(ncpClientId)}';

      function fail(msg) {
        var el = document.getElementById('map');
        if (el) el.innerHTML = '<div class="mapError">' + msg + '</div>';
      }

      function initMap() {
        try {
          var center = new naver.maps.LatLng(centerLat, centerLng);
          var map = new naver.maps.Map('map', {
            center: center,
            zoom: 13,
            minZoom: 10,
            maxZoom: 18,
            zoomControl: false,
            mapTypeControl: false,
            scaleControl: false,
            logoControl: true,
            mapDataControl: false
          });

          new naver.maps.Marker({
            position: center,
            map: map,
            icon: {
              content: '<div class="meDot"></div>',
              anchor: new naver.maps.Point(12, 12)
            },
            zIndex: 200
          });

          hospitals.forEach(function (h) {
            var pos = new naver.maps.LatLng(h.lat, h.lng);
            var html =
              '<div class="pin">' +
              '<div class="pill">' +
              h.beds +
              '병상 · ' +
              String(h.name || '').replace(/</g, '') +
              '</div>' +
              '<div class="dot" style="background:' +
              h.color +
              ';"></div></div>';
            var marker = new naver.maps.Marker({
              position: pos,
              map: map,
              icon: {
                content: html,
                anchor: new naver.maps.Point(24, 70)
              },
              zIndex: 100
            });
            naver.maps.Event.addListener(marker, 'click', function () {
              try {
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({ type: 'SELECT_HOSPITAL', id: h.id })
                );
              } catch (e) {}
            });
          });

          naver.maps.Event.addListener(map, 'click', function () {
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DESELECT' }));
            } catch (e) {}
          });
        } catch (e) {
          fail('지도 초기화 오류');
        }
      }

      var s = document.createElement('script');
      s.src =
        'https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=' + encodeURIComponent(clientId);
      s.onload = function () {
        if (typeof naver === 'undefined' || !naver.maps) {
          fail('네이버 지도 API를 불러오지 못했습니다.');
          return;
        }
        initMap();
      };
      s.onerror = function () {
        fail('네이버 지도 스크립트를 불러오지 못했습니다. Client ID와 네트워크를 확인해 주세요.');
      };
      document.head.appendChild(s);
    })();
  </script>
</body>
</html>`;
}

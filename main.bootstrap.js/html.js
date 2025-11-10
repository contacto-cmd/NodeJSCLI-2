<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certificado Royal — StreetEmporioRoyal</title>
  <style>body{font-family:sans-serif;background:#0b0b0b;color:#eee;padding:20px} pre{background:#111;padding:12px;border-radius:6px}</style>
</head>
<body>
  <h1>Certificado Royal — StreetEmporioRoyal</h1>
  <p><strong>Issuer:</strong> Royal Emporio</p>
  <p><strong>Identidad:</strong> Roberto Rivera Gamas — RFC RIGR840827PJ0</p>
  <p><strong>Huella pública (SHA-256):</strong></p>
  <pre id="fingerprint">Cargando...</pre>

  <p>
    <a id="downloadJwt" href="/certificate/token" download="certificate.jwt">Descargar token JWT</a>
  </p>

  <h3>Verificar token en el navegador</h3>
  <p>Pega aquí tu JWT y pulsa "Verificar".</p>
  <textarea id="jwt" style="width:100%;height:90px"></textarea>
  <p><button id="btn">Verificar</button></p>
  <pre id="result"></pre>

  <script>
    // muestra la huella (servida por /keys/fingerprint o ponla estática si prefieres)
    fetch('/keys/fingerprint').then(r=>r.text()).then(txt=>{ document.getElementById('fingerprint').innerText = txt; }).catch(()=>{ document.getElementById('fingerprint').innerText='(no disponible)'; });

    // verificación ligera en cliente (sin crypto RS256 completo, uso Web Crypto es complejo).
    // Aquí hacemos verificación básica: descodificar payload para leer datos (no verificar firma en navegador).
    document.getElementById('btn').onclick = () => {
      const token = document.getElementById('jwt').value.trim();
      if(!token){ document.getElementById('result').innerText='Introduce un JWT.'; return; }
      try {
        const parts = token.split('.');
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        document.getElementById('result').innerText = 'Payload (sin verificar):\\n' + JSON.stringify(payload,null,2) + '\\n\\nPara verificar la firma, comparar con la huella pública en esta página o usar el endpoint /api/verify.';
      } catch(e){
        document.getElementById('result').innerText = 'Token inválido.';
      }
    };
  </script>
</body>
</html>
const fs = require('fs');
const files = [
  'src/App.tsx',
  'src/components/AdminAssetMatrixModule.tsx',
  'src/components/AdminShipsModule.tsx',
  'src/components/ExpedicionesModule.tsx',
  'src/components/AdminPhantomStationModule.tsx',
  'src/components/GalaxyDustHUD.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Remove the aria-label="Accion" where we accidentally duplicated
  content = content.replace(/aria-label="Accion"\s+/g, '');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed Accion in:', file);
  }
});

const si = require("systeminformation");

async function getinfo() {
  const cpu = await si.cpu();
  const disk = (await si.diskLayout())[0];
  const os = await si.osInfo();
  const versions = await si.versions();
  const ram = await si.mem();

  // CPU Info
  let info = `CPU: ${cpu.manufacturer} ${cpu.brand} ${cpu.speed}GHz\n`;
  info += `Cores: ${cpu.cores} (${cpu.physicalCores} Physical)\n`;

  // RAM Info
  const totalRam = Math.round(ram.total / 1024 / 1024 / 1024);
  info += `RAM: ${totalRam}GB\n`;

  // Disk Info
  const size = Math.round(disk.size / 1024 / 1024 / 1024);
  info += `Disk: ${disk.vendor} ${disk.name} ${size}GB ${disk.type} (${disk.interfaceType})\n`;

  //OS Info
  info += `OS: ${os.distro} ${os.codename} (${os.platform})\n`;
  info += `Kernel: ${os.kernel} ${os.arch}\n`;

  // Node Info
  info += `Node: v${versions.node}\n`;
  info += `V8: ${versions.v8}`;
  return info;
}
module.exports = getinfo;

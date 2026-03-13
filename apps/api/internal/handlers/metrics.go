package handlers

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	psnet "github.com/shirou/gopsutil/v3/net"

	"github.com/avlebedinsky/lebedinsky-space/api/internal/models"
)

func Metrics(w http.ResponseWriter, r *http.Request) {
	hostname, _ := os.Hostname()

	cpuPercents, err := cpu.Percent(0, false)
	cpuVal := 0.0
	if err == nil && len(cpuPercents) > 0 {
		cpuVal = cpuPercents[0]
	}

	vmStat, err := mem.VirtualMemory()
	ramVal := 0.0
	if err == nil {
		ramVal = vmStat.UsedPercent
	}

	diskStat, err := disk.Usage("/")
	diskVal := 0.0
	if err == nil {
		diskVal = diskStat.UsedPercent
	}

	uptime := uint64(0)
	if hostInfo, err := host.Uptime(); err == nil {
		uptime = hostInfo
	}

	netIn := uint64(0)
	netOut := uint64(0)
	if counters, err := psnet.IOCounters(false); err == nil && len(counters) > 0 {
		netIn = counters[0].BytesRecv
		netOut = counters[0].BytesSent
	}

	result := models.ServerMetrics{
		Hostname: hostname,
		CPU:      round1(cpuVal),
		RAM:      round1(ramVal),
		Disk:     round1(diskVal),
		Uptime:   uptime,
		NetIn:    netIn,
		NetOut:   netOut,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func round1(v float64) float64 {
	return float64(int(v*10)) / 10
}

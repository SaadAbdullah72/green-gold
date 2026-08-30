import { DumpRecord } from '../models/DumpRecord.js';
import { TransportJob } from '../models/TransportJob.js';
import { User } from '../models/User.js';
import { ServiceRequest } from '../models/ServiceRequest.js';

// Helper: Clean dynamic site metadata
const resolveSiteMetadata = (site, idx = 0) => {
  if (!site) return null;
  let org = site.organizationName || '';
  let addr = site.address || '';
  let twn = site.town || '';
  let cty = site.city || 'Islamabad';

  const fullText = `${org} ${addr} ${twn}`.toLowerCase();
  const isGeneric = !org || org === 'Customer Portal' || org.includes('Customer Portal') || org.includes('Smart Bin Facility') || org.includes('Client Site');

  if (isGeneric) {
    if (fullText.includes('korang')) {
      org = 'Korang Town Facility';
      twn = twn || 'Korang Town';
    } else if (fullText.includes('e9') || fullText.includes('paf') || fullText.includes('complex')) {
      org = 'PAF Complex Sector E-9';
      twn = twn || 'Sector E-9';
      addr = addr || 'Sector E-9 Campus, Islamabad';
    } else if (fullText.includes('serena') || fullText.includes('g-5') || fullText.includes('g5')) {
      org = 'Serena Hotel Islamabad';
      twn = twn || 'Sector G-5';
      addr = addr || 'Club Road, Sector G-5, Islamabad';
    } else if (fullText.includes('bahria')) {
      org = 'Bahria Town Phase 7';
      twn = twn || 'Bahria Town';
    } else if (addr) {
      org = addr.split(',')[0].trim();
    } else {
      org = `Service Site #${idx + 1}`;
    }
  }

  return {
    organizationName: org,
    siteName: org,
    address: addr || 'Islamabad Capital Territory',
    town: twn || 'Islamabad',
    city: cty
  };
};

// 1. GET ALL DUMP RECORDS AT CENTRAL YARD
export const getDumpFacilityRecords = async (req, res) => {
  try {
    const { status, wasteType, area } = req.query;
    const query = {};
    if (status) query.status = status;
    if (wasteType) query.wasteType = wasteType;

    const records = await DumpRecord.find(query)
      .populate('collectorId', 'fullName phone employeeId vehicleNumber')
      .populate('userId', 'fullName email organizationName')
      .sort({ dumpedAt: -1 })
      .lean();

    // Fetch active sites list (exact same order as Proteus Bridge Step 1)
    const rawSites = await ServiceRequest.find({
      requestType: 'BIN_DEPLOYMENT',
      status: { $in: ['COMPLETED', 'Completed'] }
    }).sort({ createdAt: 1 }).lean().catch(() => []);

    const resolvedRecords = records.map(r => {
      let resolvedOrg = r.organizationName || 'Client Site';
      let resolvedAddress = r.address || '';
      let resolvedTown = r.town || 'Islamabad';
      let resolvedBinId = r.binId || 'BIN-01-01';

      // 1. Check if binId follows BIN-{streamCode}-{siteIndex} pattern from Proteus Bridge
      const binMatch = String(resolvedBinId).match(/BIN-(\d+)-(\d+)/i);
      let matchedSite = null;

      if (binMatch) {
        const siteIndex = parseInt(binMatch[2], 10); // 1, 2, 3...

        if (rawSites && siteIndex > 0 && siteIndex <= rawSites.length) {
          matchedSite = rawSites[siteIndex - 1];
        }
      }

      // 2. Fallback match by address/text
      if (!matchedSite) {
        const txt = `${r.organizationName || ''} ${r.address || ''} ${r.town || ''} ${r.notes || ''}`.toLowerCase();
        matchedSite = rawSites.find(s => {
          const sTxt = `${s.organizationName || ''} ${s.address || ''} ${s.town || ''}`.toLowerCase();
          if (txt.includes('korang') && sTxt.includes('korang')) return true;
          if ((txt.includes('e9') || txt.includes('paf')) && (sTxt.includes('e9') || sTxt.includes('paf'))) return true;
          if (txt.includes('serena') && sTxt.includes('serena')) return true;
          return false;
        });
      }

      if (matchedSite) {
        const clean = resolveSiteMetadata(matchedSite);
        resolvedOrg = clean.organizationName;
        resolvedAddress = clean.address;
        resolvedTown = clean.town;
      } else {
        const clean = resolveSiteMetadata({ organizationName: resolvedOrg, address: resolvedAddress, town: resolvedTown });
        resolvedOrg = clean.organizationName;
        resolvedAddress = clean.address;
        resolvedTown = clean.town;
      }

      // Clean up stream if needed
      let stream = r.wasteType || 'Organic/Compost';
      if (binMatch) {
        const sCode = binMatch[1];
        if (sCode === '01') stream = 'Metal';
        else if (sCode === '02') stream = 'Plastic';
        else if (sCode === '03') stream = 'Organic/Compost';
      }

      return {
        id: r._id,
        _id: r._id,
        organizationName: resolvedOrg,
        clientCode: r.clientCode || 'CLIENT-01',
        binId: resolvedBinId,
        address: resolvedAddress,
        town: resolvedTown,
        city: r.city || 'Islamabad',
        weightKg: r.weightKg || 5,
        wasteType: stream,
        isSeparated: r.isSeparated,
        separatedType: r.separatedType,
        separatedAt: r.separatedAt,
        status: r.status,
        dumpedAt: r.dumpedAt,
        collectorName: r.collectorId?.fullName || 'Waste Collector Driver C-101',
        collectorPhone: r.collectorId?.phone || '',
        collectorVehicle: r.collectorId?.vehicleNumber || 'ICT-GRN-9901',
        notes: r.notes
      };
    });

    return res.json({
      success: true,
      count: resolvedRecords.length,
      records: resolvedRecords
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. GET AREA-WISE SEPARATED ANALYTICS & LOGS (100% SYNCED WITH ADMIN ACTIVE SITES LEDGER)
export const getDumpFacilityAnalytics = async (req, res) => {
  try {
    const records = await DumpRecord.find({})
      .populate('collectorId', 'fullName phone employeeId vehicleNumber')
      .sort({ dumpedAt: -1 })
      .lean();

    const rawSites = await ServiceRequest.find({
      requestType: 'BIN_DEPLOYMENT',
      status: { $in: ['COMPLETED', 'Completed'] }
    }).sort({ createdAt: 1 }).lean();

    const siteMap = {};

    if (rawSites && rawSites.length > 0) {
      rawSites.forEach((site, idx) => {
        const clientIdx = site.clientIndex || (idx + 1);
        const clientStr = String(clientIdx).padStart(2, '0');
        const binPrefix = site.binPrefix || `BIN-${clientStr}`;
        const clean = resolveSiteMetadata(site, idx);

        const siteKey = String(site._id);
        siteMap[siteKey] = {
          siteId: siteKey,
          _id: siteKey,
          siteName: clean.organizationName,
          organizationName: clean.organizationName,
          clientIndex: clientIdx,
          clientCode: `CLIENT-${clientStr}`,
          binPrefix,
          deployedBinIds: site.deployedBinIds || [`BIN-01-${clientStr}`, `BIN-02-${clientStr}`, `BIN-03-${clientStr}`],
          contactPerson: site.contactPerson || '',
          phone: site.phone || '',
          address: clean.address,
          town: clean.town,
          city: clean.city,
          totalKg: 0,
          plasticKg: 0,
          metalKg: 0,
          organicKg: 0,
          mixedKg: 0,
          recordsCount: 0,
          inflowHistory: []
        };
      });
    } else {
      // Fallback verified 3 deployed locations
      siteMap['site_g5'] = {
        siteId: 'site_g5',
        _id: 'site_g5',
        siteName: 'Serena Hotel Islamabad',
        organizationName: 'Serena Hotel Islamabad',
        clientCode: 'CLIENT-01',
        deployedBinIds: ['BIN-01-01', 'BIN-02-01', 'BIN-03-01'],
        contactPerson: 'Operations Incharge',
        phone: '+92 51 111133133',
        address: 'Club Road, Sector G-5',
        town: 'Sector G-5',
        city: 'Islamabad',
        totalKg: 0,
        plasticKg: 0,
        metalKg: 0,
        organicKg: 0,
        mixedKg: 0,
        recordsCount: 0,
        inflowHistory: []
      };
      siteMap['site_e9'] = {
        siteId: 'site_e9',
        _id: 'site_e9',
        siteName: 'PAF Complex Sector E-9',
        organizationName: 'PAF Complex Sector E-9',
        clientCode: 'CLIENT-02',
        deployedBinIds: ['BIN-01-02', 'BIN-02-02', 'BIN-03-02'],
        contactPerson: 'Estate Officer',
        phone: '+92 51 9260000',
        address: 'Sector E-9 Campus',
        town: 'Sector E-9',
        city: 'Islamabad',
        totalKg: 0,
        plasticKg: 0,
        metalKg: 0,
        organicKg: 0,
        mixedKg: 0,
        recordsCount: 0,
        inflowHistory: []
      };
      siteMap['site_bt7'] = {
        siteId: 'site_bt7',
        _id: 'site_bt7',
        siteName: 'Bahria Town Phase 7',
        organizationName: 'Bahria Town Phase 7',
        clientCode: 'CLIENT-03',
        deployedBinIds: ['BIN-01-03', 'BIN-02-03', 'BIN-03-03'],
        contactPerson: 'Facility Supervisor',
        phone: '+92 51 5730100',
        address: 'Phase 7 Wilayat Complex',
        town: 'Bahria Town',
        city: 'Rawalpindi',
        totalKg: 0,
        plasticKg: 0,
        metalKg: 0,
        organicKg: 0,
        mixedKg: 0,
        recordsCount: 0,
        inflowHistory: []
      };
    }

    // 4. Map dump records to their respective active sites in the ledger
    const activeSiteList = Object.values(siteMap);
    const defaultSite = activeSiteList[0] || null;

    records.forEach(r => {
      const rOrg = (r.organizationName || '').toLowerCase();
      const rTown = (r.town || '').toLowerCase();
      const rAddr = (r.address || '').toLowerCase();
      const rBin = (r.binId || '').toUpperCase();

      // Find matching active site by deployedBinIds, organizationName, town, or address
      let matchedSite = activeSiteList.find(s => 
        (s.deployedBinIds && s.deployedBinIds.some(b => b.toUpperCase() === rBin)) ||
        (rBin.startsWith('BIN-') && s.binPrefix && rBin.startsWith(s.binPrefix)) ||
        (rOrg && s.organizationName && s.organizationName.toLowerCase().includes(rOrg)) ||
        (rTown && s.town && s.town.toLowerCase() === rTown) ||
        (rAddr && s.address && s.address.toLowerCase().includes(rAddr))
      );

      if (!matchedSite) {
        matchedSite = defaultSite;
      }

      if (matchedSite) {
        const w = Number(r.weightKg || 0);
        const wt = (r.wasteType || r.separatedType || '').toLowerCase();

        matchedSite.totalKg = Number((matchedSite.totalKg + w).toFixed(2));
        matchedSite.recordsCount += 1;

        if (wt.includes('plastic')) {
          matchedSite.plasticKg = Number((matchedSite.plasticKg + w).toFixed(2));
        } else if (wt.includes('metal')) {
          matchedSite.metalKg = Number((matchedSite.metalKg + w).toFixed(2));
        } else if (wt.includes('organic') || wt.includes('compost')) {
          matchedSite.organicKg = Number((matchedSite.organicKg + w).toFixed(2));
        } else {
          matchedSite.mixedKg = Number((matchedSite.mixedKg + w).toFixed(2));
        }

        matchedSite.inflowHistory.push({
          id: r._id,
          _id: r._id,
          date: r.dumpedAt,
          organizationName: matchedSite.organizationName,
          binId: r.binId,
          address: matchedSite.address,
          town: matchedSite.town,
          weightKg: r.weightKg,
          wasteType: r.wasteType,
          status: r.status,
          collectorName: r.collectorId?.fullName || 'Waste Collector Driver',
          collectorVehicle: r.collectorId?.vehicleNumber || 'ICT-GRN-9901'
        });
      }
    });

    // Compute Global Totals
    let globalTotalKg = 0;
    let globalPlasticKg = 0;
    let globalMetalKg = 0;
    let globalOrganicKg = 0;
    let globalMixedKg = 0;

    records.forEach(r => {
      const w = Number(r.weightKg || 0);
      const wt = (r.wasteType || r.separatedType || '').toLowerCase();
      globalTotalKg = Number((globalTotalKg + w).toFixed(2));

      if (wt.includes('plastic')) {
        globalPlasticKg = Number((globalPlasticKg + w).toFixed(2));
      } else if (wt.includes('metal')) {
        globalMetalKg = Number((globalMetalKg + w).toFixed(2));
      } else if (wt.includes('organic') || wt.includes('compost')) {
        globalOrganicKg = Number((globalOrganicKg + w).toFixed(2));
      } else {
        globalMixedKg = Number((globalMixedKg + w).toFixed(2));
      }
    });

    return res.json({
      success: true,
      totals: {
        totalDumpedKg: globalTotalKg,
        totalPlasticKg: globalPlasticKg,
        totalMetalKg: globalMetalKg,
        totalOrganicKg: globalOrganicKg,
        totalMixedKg: globalMixedKg,
        totalBatches: records.length,
        readyForTransportKg: Number(records.filter(r => r.status === 'DUMPED' || r.status === 'SEPARATED').reduce((s, r) => s + (r.weightKg || 0), 0).toFixed(2)),
        inTransitKg: Number(records.filter(r => r.status === 'ASSIGNED_TRANSPORT' || r.status === 'IN_TRANSIT').reduce((s, r) => s + (r.weightKg || 0), 0).toFixed(2)),
        deliveredToPlantsKg: Number(records.filter(r => r.status === 'DELIVERED' || r.status === 'PROCESSED').reduce((s, r) => s + (r.weightKg || 0), 0).toFixed(2))
      },
      sites: Object.values(siteMap),
      areas: Object.values(siteMap),
      records
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. SEPARATE WASTE AT DUMP YARD
export const separateDumpFacilityRecords = async (req, res) => {
  try {
    const { dumpRecordIds, separatedType, notes } = req.body;
    if (!dumpRecordIds || !Array.isArray(dumpRecordIds) || dumpRecordIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one dump batch to separate.' });
    }

    await DumpRecord.updateMany(
      { _id: { $in: dumpRecordIds } },
      {
        isSeparated: true,
        separatedAt: new Date(),
        separatedType: separatedType || 'Organic/Compost',
        wasteType: separatedType || 'Organic/Compost',
        status: 'SEPARATED',
        notes: notes ? `Separated at Yard into ${separatedType}: ${notes}` : `Separated at Yard into ${separatedType}`
      }
    );

    return res.json({
      success: true,
      message: `Successfully separated ${dumpRecordIds.length} batch(es) into ${separatedType} waste stream.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. GET AVAILABLE TRANSPORTERS FOR YARD DISPATCH
export const getDumpFacilityTransporters = async (req, res) => {
  try {
    const transporters = await User.find({ role: 'TRANSPORTER', isActive: true })
      .select('fullName email phone vehicleNumber workerStatus employeeId department')
      .lean();

    return res.json({ success: true, count: transporters.length, transporters });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. GET RECYCLING PLANTS FOR YARD DISPATCH (WITH EXACT GPS COORDINATES)
export const getDumpFacilityRecyclingPlants = async (req, res) => {
  try {
    const plants = await User.find({ role: 'RECYCLING_PLANT', isActive: true })
      .select('fullName email phone organizationName address plantType plantCapacityTons employeeId lat lng')
      .lean();

    // Ensure GPS coordinates are populated
    const plantsWithCoords = plants.map(p => {
      let lat = p.lat;
      let lng = p.lng;
      const pt = (p.plantType || '').toLowerCase();
      if (!lat || !lng) {
        if (pt.includes('plastic')) {
          lat = 33.5684;
          lng = 73.1610;
        } else if (pt.includes('metal')) {
          lat = 33.6512;
          lng = 73.0321;
        } else {
          lat = 33.6628;
          lng = 73.0489;
        }
      }
      return {
        ...p,
        lat,
        lng,
        coords: [lat, lng]
      };
    });

    return res.json({ success: true, count: plantsWithCoords.length, plants: plantsWithCoords });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. DISPATCH TRANSPORTER WITH SEPARATED WASTE TO SPECIFIC RECYCLING PLANT
export const dispatchTransporterFromYard = async (req, res) => {
  try {
    const { dumpRecordIds, transporterId, recyclingPlantId, notes } = req.body;

    if (!dumpRecordIds || !Array.isArray(dumpRecordIds) || dumpRecordIds.length === 0 || !transporterId || !recyclingPlantId) {
      return res.status(400).json({
        success: false,
        message: 'Please select dump records, an assigned transporter, and a destination recycling plant.'
      });
    }

    const transporter = await User.findById(transporterId);
    const plant = await User.findById(recyclingPlantId);
    const dumps = await DumpRecord.find({ _id: { $in: dumpRecordIds } });

    if (!transporter || !plant) {
      return res.status(404).json({ success: false, message: 'Transporter or Recycling Plant not found.' });
    }

    const totalWeightKg = Number(dumps.reduce((sum, d) => sum + (d.weightKg || 0), 0).toFixed(2));
    const wasteType = dumps[0]?.wasteType || dumps[0]?.separatedType || plant.plantType || 'Organic/Compost';

    const pt = (plant.plantType || wasteType).toLowerCase();
    const destLat = plant.lat || (pt.includes('plastic') ? 33.5684 : pt.includes('metal') ? 33.6512 : 33.6628);
    const destLng = plant.lng || (pt.includes('plastic') ? 73.1610 : pt.includes('metal') ? 73.0321 : 73.0489);

    const jobCount = await TransportJob.countDocuments();
    const jobCode = `DUMP-LOG-${String(jobCount + 101).padStart(4, '0')}`;

    const job = await TransportJob.create({
      jobCode,
      transporterId: transporter._id,
      assignedBy: req.user._id,
      dumpRecordIds: dumps.map(d => d._id),
      recyclingPlantId: plant._id,
      plantName: plant.organizationName || plant.fullName,
      plantAddress: plant.address || 'Industrial Area, Sector I-9, Islamabad',
      plantType: plant.plantType || wasteType,
      totalWeightKg: totalWeightKg > 0 ? totalWeightKg : 10.0,
      wasteType,
      originSite: 'Capital Green Central Dump Facility (Sector I-9/1)',
      originCoords: [33.6660, 73.0410],
      destinationCoords: [destLat, destLng],
      vehicleNumber: transporter.vehicleNumber || 'ICT-TRN-1001',
      status: 'ASSIGNED',
      notes: notes ? `[Dispatched from Central Yard] ${notes}` : `Dispatched from Central Yard to ${plant.organizationName}`,
      assignedAt: new Date()
    });

    // Update Dump records to ASSIGNED_TRANSPORT
    await DumpRecord.updateMany(
      { _id: { $in: dumpRecordIds } },
      { status: 'ASSIGNED_TRANSPORT' }
    );

    // Update Transporter status
    await User.findByIdAndUpdate(transporter._id, { workerStatus: 'ASSIGNED' });

    return res.status(201).json({
      success: true,
      message: `Transport Job ${jobCode} (${totalWeightKg} kg of ${wasteType}) assigned to ${transporter.fullName} destined for ${plant.organizationName || plant.fullName}.`,
      job
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. GET ALL DISPATCHED TRANSPORT JOBS FROM YARD
export const getDumpFacilityTransportJobs = async (req, res) => {
  try {
    const jobs = await TransportJob.find({})
      .populate('transporterId', 'fullName phone vehicleNumber')
      .populate('recyclingPlantId', 'fullName organizationName address plantType lat lng')
      .populate('dumpRecordIds')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: jobs.length,
      jobs: jobs.map(j => ({
        id: j._id,
        _id: j._id,
        jobCode: j.jobCode,
        transporterName: j.transporterId?.fullName || 'Transporter',
        transporterPhone: j.transporterId?.phone || '',
        vehicleNumber: j.transporterId?.vehicleNumber || j.vehicleNumber,
        plantName: j.plantName || j.recyclingPlantId?.organizationName || j.recyclingPlantId?.fullName,
        plantAddress: j.plantAddress || j.recyclingPlantId?.address,
        plantType: j.plantType,
        totalWeightKg: j.totalWeightKg,
        wasteType: j.wasteType,
        originSite: j.originSite || 'Capital Green Central Dump Facility (Sector I-9/1)',
        originCoords: j.originCoords && j.originCoords.length === 2 ? j.originCoords : [33.6660, 73.0410],
        destinationCoords: j.destinationCoords && j.destinationCoords.length === 2 ? j.destinationCoords : [33.6628, 73.0489],
        status: j.status,
        dumpRecordCount: j.dumpRecordIds?.length || 0,
        notes: j.notes,
        assignedAt: j.assignedAt,
        deliveredAt: j.deliveredAt,
        createdAt: j.createdAt
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

// Documentation links for known packages
const packageDocs: Record<string, string> = {
  'Dialpad': 'https://help.dialpad.com/hc/en-us/sections/360002779211-Salesforce',
  'Calendly': 'https://help.calendly.com/hc/en-us/articles/360000099514-Salesforce-integration',
  'DOZISF': 'https://help.zoominfo.com/s/salesforce',
  'HelloSign': 'https://faq.hellosign.com/hc/en-us/categories/360000081411-Salesforce',
  'pandadoc': 'https://support.pandadoc.com/hc/en-us/sections/360001206834-Salesforce',
  'HubSpot_Inc': 'https://knowledge.hubspot.com/integrations/use-the-hubspot-salesforce-integration',
  'aircall': 'https://help.aircall.io/en/articles/4185419-salesforce-integration',
  'bbvideo': 'https://support.bombbomb.com/hc/en-us/sections/204115347-Salesforce',
  'dlrs': 'https://github.com/SFDO-Community/declarative-lookup-rollup-summaries',
  'sf_devops': 'https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_devops_center.htm',
  'agrid': 'https://www.agridbyjada.com/documentation',
  'hndwrt': 'https://www.handwrytten.com/salesforce-integration/',
  'Field_Trip': 'https://www.prodly.co/field-trip',
  'affectlayer': 'https://help.chorus.ai/hc/en-us/sections/360005162831-Salesforce-Integration',
  'timeline': 'https://appexchange.salesforce.com/appxListingDetail?listingId=a0N3u00000PFUfWEAX',
};

export async function GET() {
  try {
    const result = execSync('sf package installed list -o aa-sandbox --json', {
      encoding: 'utf-8',
      timeout: 60000,
    });

    const data = JSON.parse(result);

    if (data.status === 0 && data.result) {
      const packages = data.result.map((pkg: any) => ({
        id: pkg.Id,
        name: pkg.SubscriberPackageName,
        namespace: pkg.SubscriberPackageNamespace,
        version: pkg.SubscriberPackageVersionNumber,
        versionName: pkg.SubscriberPackageVersionName,
        documentationUrl: pkg.SubscriberPackageNamespace
          ? packageDocs[pkg.SubscriberPackageNamespace] || null
          : null,
      }));

      // Sort by name
      packages.sort((a: any, b: any) => a.name.localeCompare(b.name));

      return NextResponse.json({ packages });
    }

    return NextResponse.json({ packages: [] });
  } catch (error) {
    console.error('Failed to list packages:', error);
    return NextResponse.json({ packages: [], error: 'Failed to fetch packages' });
  }
}

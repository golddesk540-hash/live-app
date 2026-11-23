const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../apps/web/lib/design/designFixtures.ts');
let c = fs.readFileSync(targetPath, 'utf8');
const isCRLF = c.includes('\r\n');
const nl = isCRLF ? '\r\n' : '\n';

// 1. Add honorLevel to FixtureUserProfile interface
if (!c.includes('honorLevel?: number;')) {
  c = c.replace(
    'wealthLevel: number;' + nl + '  hostLevel: number;',
    'wealthLevel: number;' + nl + '  hostLevel: number;' + nl + '  honorLevel?: number;'
  );
}

// 2. Add honorLevel: 5 to profileAminaNoor
if (!c.includes('honorLevel: 5,')) {
  c = c.replace(
    'hostLevel: 18,' + nl + '    vipLevel: 3,',
    'hostLevel: 18,' + nl + '    honorLevel: 5,' + nl + '    vipLevel: 3,'
  );
}

// 3. Add FixtureInvitedUser and FixtureInvitationInfo interfaces
if (!c.includes('export interface FixtureInvitationInfo')) {
  const iface =
    'export interface FixtureInvitedUser {' + nl +
    '  userId: string;' + nl +
    '  nickname: string;' + nl +
    '  avatarUrl: string;' + nl +
    '  wealthLevel: number;' + nl +
    '  hostLevel: number;' + nl +
    '  joinedAgo: string;' + nl +
    '  bonusEarned: number;' + nl +
    '}' + nl + nl +
    'export interface FixtureInvitationInfo {' + nl +
    '  inviteCode: string;' + nl +
    '  inviteUrl: string;' + nl +
    '  totalInvited: number;' + nl +
    '  totalCoinsEarned: number;' + nl +
    '  joinedUsers: FixtureInvitedUser[];' + nl +
    '}' + nl + nl;
  c = c.replace('export interface FixtureProfileVisitor', iface + 'export interface FixtureProfileVisitor');
}

// 4. Add invitationInfo getter to DesignFixtures
if (!c.includes('public static get invitationInfo()')) {
  const getter =
    '  public static get invitationInfo(): FixtureInvitationInfo {' + nl +
    '    if (this.isError) {' + nl +
    '      throw new DesignFixtureError("Invitation referral server unavailable [ERR_INVITE_503]", "ERR_INVITE_503", "invites");' + nl +
    '    }' + nl +
    '    if (this.isEmpty) {' + nl +
    '      return {' + nl +
    '        inviteCode: "POPO883901",' + nl +
    '        inviteUrl: "https://popolive.app/invite/POPO883901",' + nl +
    '        totalInvited: 0,' + nl +
    '        totalCoinsEarned: 0,' + nl +
    '        joinedUsers: [],' + nl +
    '      };' + nl +
    '    }' + nl +
    '    return {' + nl +
    '      inviteCode: "POPO883901",' + nl +
    '      inviteUrl: "https://popolive.app/invite/POPO883901",' + nl +
    '      totalInvited: 4,' + nl +
    '      totalCoinsEarned: 20000,' + nl +
    '      joinedUsers: [' + nl +
    '        {' + nl +
    '          userId: "u_sana_ali",' + nl +
    '          nickname: "Sana Ali",' + nl +
    '          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",' + nl +
    '          wealthLevel: 14,' + nl +
    '          hostLevel: 15,' + nl +
    '          joinedAgo: "3 days ago",' + nl +
    '          bonusEarned: 5000,' + nl +
    '        },' + nl +
    '        {' + nl +
    '          userId: "u_bilal_ahmed",' + nl +
    '          nickname: "Bilal Ahmed",' + nl +
    '          avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",' + nl +
    '          wealthLevel: 10,' + nl +
    '          hostLevel: 14,' + nl +
    '          joinedAgo: "1 week ago",' + nl +
    '          bonusEarned: 5000,' + nl +
    '        },' + nl +
    '        {' + nl +
    '          userId: "u_zainab_khan",' + nl +
    '          nickname: "Zainab Khan",' + nl +
    '          avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150",' + nl +
    '          wealthLevel: 9,' + nl +
    '          hostLevel: 12,' + nl +
    '          joinedAgo: "2 weeks ago",' + nl +
    '          bonusEarned: 5000,' + nl +
    '        },' + nl +
    '        {' + nl +
    '          userId: "u_hamza_tariq",' + nl +
    '          nickname: "Hamza Tariq",' + nl +
    '          avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",' + nl +
    '          wealthLevel: 12,' + nl +
    '          hostLevel: 10,' + nl +
    '          joinedAgo: "3 weeks ago",' + nl +
    '          bonusEarned: 5000,' + nl +
    '        },' + nl +
    '      ],' + nl +
    '    };' + nl +
    '  }' + nl + nl;
  c = c.replace('  public static get guardians()', getter + '  public static get guardians()');
}

fs.writeFileSync(targetPath, c, 'utf8');
console.log('Updated designFixtures.ts successfully');

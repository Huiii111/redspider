// Realistic AWS resources, each with faults that can be planted in them.
// A fault changes exactly one thing in the model. Requirements are NIST SP 800-53 Rev. 5 controls,
// paraphrased. This set is for demos and stress testing only: it does not replace tests/heldout/.
import { s, n, b, raw, list, map, bind, policy, attr, block } from './hcl.js';

const NIST = 'NIST SP 800-53 Rev. 5';
export const REQUIREMENTS = {
  'AC-3': 'Enforce approved authorizations for logical access to information and system resources.',
  'AC-6': 'Allow only the access that users and processes need to accomplish their assigned tasks.',
  'SC-7': 'Monitor and control communications at the external boundary of the system and at key internal boundaries.',
  'SC-8': 'Protect the confidentiality and integrity of transmitted information.',
  'SC-12': 'Establish and manage cryptographic keys, including their rotation, when cryptography is used in the system.',
  'SC-28': 'Protect the confidentiality and integrity of information at rest.',
  'CP-9': 'Back up system-level and user-level information and protect the confidentiality and integrity of the backups.',
  'AU-9': 'Protect audit information from unauthorized access, modification and deletion.',
  'AU-12': 'Generate audit records for the defined auditable events across the system.',
};
const req = (ref) => ({ source: NIST, ref, text: REQUIREMENTS[ref] });

function findBlock(file, type, name) {
  const blk = file.blocks.find((x) => x.name === 'resource' && x.labels[0] === type && x.labels[1] === name);
  if (!blk) throw new Error(`fault target ${type}.${name} not found`);
  return blk;
}
function setAttr(blk, key, value) {
  const item = blk.body.find((i) => i.k === 'attr' && i.key === key);
  if (!item) throw new Error(`attribute ${key} not found in ${blk.labels.join('.')}`);
  item.value = value;
}
function dropAttr(blk, key) {
  const i = blk.body.findIndex((x) => x.k === 'attr' && x.key === key);
  if (i < 0) throw new Error(`attribute ${key} not found`);
  blk.body.splice(i, 1);
}
const setBinding = (name, value) => (file) => {
  if (!file.bindings[name]) throw new Error(`binding ${name} not found`);
  file.bindings[name].value = value;
};

// Every scenario: build(ctx) -> { blocks, faults: [{ id, title, requirement, apply(file) }] }
// ctx gives names, tags and bindings (a value that may be inlined, a variable or a local).
export const SCENARIOS = [
  {
    id: 's3',
    build(ctx) {
      const r = ctx.ident('bucket');
      const ref = `aws_s3_bucket.${r}.id`;
      const bpa = ctx.bind(`${r}_block_public_acls`, b(true), 'Block public ACLs on the bucket');
      const ver = ctx.bind(`${r}_versioning`, s('Enabled'));
      return {
        blocks: [
          ctx.resource('aws_s3_bucket', r, [attr('bucket', s(ctx.dnsName())), ctx.tags()]),
          ctx.resource('aws_s3_bucket_public_access_block', r, ctx.shuffle([
            attr('bucket', raw(ref)),
            attr('block_public_acls', bpa),
            attr('block_public_policy', b(true)),
            attr('ignore_public_acls', b(true)),
            attr('restrict_public_buckets', b(true)),
          ], 1)),
          ctx.resource('aws_s3_bucket_server_side_encryption_configuration', r, [
            attr('bucket', raw(ref)),
            block('rule', [], [block('apply_server_side_encryption_by_default', [], [attr('sse_algorithm', s('aws:kms'))])]),
          ]),
          ctx.resource('aws_s3_bucket_versioning', r, [
            attr('bucket', raw(ref)),
            block('versioning_configuration', [], [attr('status', ver)]),
          ]),
        ],
        faults: [
          { id: 's3-public-acls-allowed', title: 'Storage bucket accepts public ACLs', requirement: req('AC-3'), apply: setBinding(`${r}_block_public_acls`, b(false)) },
          {
            id: 's3-encryption-removed', title: 'Storage bucket has no default encryption', requirement: req('SC-28'),
            apply(file) {
              const i = file.blocks.findIndex((x) => x.labels[0] === 'aws_s3_bucket_server_side_encryption_configuration' && x.labels[1] === r);
              file.blocks.splice(i, 1);
            },
          },
          { id: 's3-versioning-suspended', title: 'Storage bucket versioning is suspended', requirement: req('CP-9'), apply: setBinding(`${r}_versioning`, s('Suspended')) },
        ],
      };
    },
  },
  {
    id: 'security-group',
    build(ctx) {
      const r = ctx.ident('sg');
      const cidr = ctx.bind('admin_cidr', s('10.20.0.0/16'), 'CIDR allowed to SSH in');
      const vpc = ctx.bind('vpc_id', s('vpc-0a1b2c3d4e5f60718'), null, 'var');
      return {
        blocks: [ctx.resource('aws_security_group', r, [
          attr('name', s(ctx.dnsName())),
          attr('description', s('Web tier')),
          attr('vpc_id', vpc),
          block('ingress', [], [attr('description', s('HTTPS from anywhere')), attr('from_port', n(443)), attr('to_port', n(443)), attr('protocol', s('tcp')), attr('cidr_blocks', list(s('0.0.0.0/0')))]),
          block('ingress', [], [attr('description', s('SSH from VPN')), attr('from_port', n(22)), attr('to_port', n(22)), attr('protocol', s('tcp')), attr('cidr_blocks', list(cidr))]),
          block('egress', [], [attr('from_port', n(0)), attr('to_port', n(0)), attr('protocol', s('-1')), attr('cidr_blocks', list(s('0.0.0.0/0')))]),
          ctx.tags(),
        ])],
        faults: [
          { id: 'sg-ssh-open-to-world', title: 'SSH is open to the whole internet', requirement: req('SC-7'), apply: setBinding('admin_cidr', s('0.0.0.0/0')) },
          {
            id: 'sg-rdp-open-ipv6', title: 'Remote desktop is open to all IPv6 addresses', requirement: req('SC-7'),
            apply(file) {
              const blk = findBlock(file, 'aws_security_group', r);
              const at = blk.body.findIndex((i) => i.k === 'block' && i.name === 'egress');
              blk.body.splice(at, 0, block('ingress', [], [attr('description', s('RDP')), attr('from_port', n(3389)), attr('to_port', n(3389)), attr('protocol', s('tcp')), attr('ipv6_cidr_blocks', list(s('::/0')))]));
            },
          },
        ],
      };
    },
  },
  {
    id: 'rds',
    countable: true,
    build(ctx) {
      const r = ctx.ident('db');
      const enc = ctx.bind('db_storage_encrypted', b(true));
      const pub = ctx.bind('db_publicly_accessible', b(false));
      const keep = ctx.bind('db_backup_retention_days', n(7), 'Days to keep automated backups');
      return {
        blocks: [ctx.resource('aws_db_instance', r, [
          attr('identifier', s(ctx.dnsName())),
          ...ctx.shuffle([
            attr('engine', s('postgres')),
            attr('engine_version', s('16.3')),
            attr('instance_class', s('db.t3.medium')),
            attr('allocated_storage', n(50)),
            attr('username', s('app_admin')),
            attr('manage_master_user_password', b(true)),
            attr('storage_encrypted', enc),
            attr('publicly_accessible', pub),
            attr('backup_retention_period', keep),
            attr('deletion_protection', b(true)),
            attr('skip_final_snapshot', b(false)),
          ]),
          ctx.tags(),
        ], { countable: true })],
        faults: [
          { id: 'rds-unencrypted', title: 'Database storage is not encrypted', requirement: req('SC-28'), apply: setBinding('db_storage_encrypted', b(false)) },
          { id: 'rds-public', title: 'Database is reachable from the internet', requirement: req('SC-7'), apply: setBinding('db_publicly_accessible', b(true)) },
          { id: 'rds-no-backups', title: 'Database automated backups are turned off', requirement: req('CP-9'), apply: setBinding('db_backup_retention_days', n(0)) },
        ],
      };
    },
  },
  {
    id: 'ebs',
    build(ctx) {
      const r = ctx.ident('volume');
      const enc = ctx.bind(`${r}_encrypted`, b(true));
      return {
        blocks: [ctx.resource('aws_ebs_volume', r, ctx.shuffle([
          attr('availability_zone', s('eu-west-1a')),
          attr('size', n(ctx.pick([20, 100, 500]))),
          attr('type', s('gp3')),
          attr('encrypted', enc),
        ]).concat(ctx.tags()), { countable: true })],
        faults: [{ id: 'ebs-unencrypted', title: 'Disk volume is not encrypted', requirement: req('SC-28'), apply: setBinding(`${r}_encrypted`, b(false)) }],
      };
    },
  },
  {
    id: 'kms',
    build(ctx) {
      const r = ctx.ident('key');
      const rot = ctx.bind('kms_key_rotation', b(true));
      return {
        blocks: [
          ctx.resource('aws_kms_key', r, [attr('description', s('Application data key')), attr('deletion_window_in_days', n(30)), attr('enable_key_rotation', rot), ctx.tags()]),
          ctx.resource('aws_kms_alias', r, [attr('name', s(`alias/${ctx.dnsName()}`)), attr('target_key_id', raw(`aws_kms_key.${r}.key_id`))]),
        ],
        faults: [{ id: 'kms-rotation-off', title: 'Encryption key is never rotated', requirement: req('SC-12'), apply: setBinding('kms_key_rotation', b(false)) }],
      };
    },
  },
  {
    id: 'cloudtrail',
    build(ctx) {
      const r = ctx.ident('trail');
      const val = ctx.bind('trail_log_file_validation', b(true));
      const multi = ctx.bind('trail_multi_region', b(true));
      return {
        blocks: [ctx.resource('aws_cloudtrail', r, [
          attr('name', s(ctx.dnsName())),
          attr('s3_bucket_name', s(`${ctx.dnsName()}-audit`)),
          ...ctx.shuffle([
            attr('include_global_service_events', b(true)),
            attr('is_multi_region_trail', multi),
            attr('enable_log_file_validation', val),
          ]),
          attr('kms_key_id', s('arn:aws:kms:eu-west-1:111122223333:key/1234abcd-12ab-34cd-56ef-1234567890ab')),
          ctx.tags(),
        ])],
        faults: [
          { id: 'trail-validation-off', title: 'Audit log files can be altered without detection', requirement: req('AU-9'), apply: setBinding('trail_log_file_validation', b(false)) },
          { id: 'trail-single-region', title: 'Audit trail records only one region', requirement: req('AU-12'), apply: setBinding('trail_multi_region', b(false)) },
        ],
      };
    },
  },
  {
    id: 'iam',
    build(ctx) {
      const r = ctx.ident('policy');
      const bucket = ctx.dnsName();
      const doc = {
        Version: '2012-10-17',
        Statement: [{ Sid: 'AppObjects', Effect: 'Allow', Action: ['s3:GetObject', 's3:PutObject'], Resource: [`arn:aws:s3:::${bucket}/*`] }],
      };
      return {
        blocks: [ctx.resource('aws_iam_policy', r, [attr('name', s(`${bucket}-rw`)), attr('policy', policy(doc, ctx.pick(['heredoc', 'jsonencode'])))], { countable: true })],
        faults: [{
          id: 'iam-wildcard-admin', title: 'Access policy grants every action on every resource', requirement: req('AC-6'),
          apply(file) {
            const item = findBlock(file, 'aws_iam_policy', r).body.find((i) => i.key === 'policy');
            item.value.v.Statement[0].Action = '*';
            item.value.v.Statement[0].Resource = '*';
          },
        }],
      };
    },
  },
  {
    id: 'lb-listener',
    build(ctx) {
      const r = ctx.ident('listener');
      return {
        blocks: [ctx.resource('aws_lb_listener', r, [
          attr('load_balancer_arn', ctx.bind('alb_arn', s('arn:aws:elasticloadbalancing:eu-west-1:111122223333:loadbalancer/app/web/50dc6c495c0c9188'), null, 'var')),
          attr('port', n(443)),
          attr('protocol', s('HTTPS')),
          attr('ssl_policy', s('ELBSecurityPolicy-TLS13-1-2-2021-06')),
          attr('certificate_arn', ctx.bind('certificate_arn', s('arn:aws:acm:eu-west-1:111122223333:certificate/f1e2d3c4-b5a6-4789-8abc-def012345678'), null, 'var')),
          block('default_action', [], [attr('type', s('forward')), attr('target_group_arn', ctx.bind('target_group_arn', s('arn:aws:elasticloadbalancing:eu-west-1:111122223333:targetgroup/web/6d0ecf831eec9f09'), null, 'var'))]),
        ], { countable: true })],
        faults: [{
          id: 'lb-plain-http', title: 'Load balancer serves traffic over plain HTTP', requirement: req('SC-8'),
          apply(file) {
            const blk = findBlock(file, 'aws_lb_listener', r);
            setAttr(blk, 'port', n(80));
            setAttr(blk, 'protocol', s('HTTP'));
            dropAttr(blk, 'ssl_policy');
            dropAttr(blk, 'certificate_arn');
          },
        }],
      };
    },
  },
];

// Unrelated resources that make a file look like real code. They are identical in both twins.
export const FILLERS = [
  (ctx) => ctx.resource('aws_cloudwatch_log_group', ctx.ident('logs'), [attr('name', s(`/app/${ctx.dnsName()}`)), attr('retention_in_days', n(ctx.pick([30, 90, 365])))]),
  (ctx) => ctx.resource('aws_ssm_parameter', ctx.ident('param'), [attr('name', s(`/${ctx.dnsName()}/feature_flags`)), attr('type', s('String')), attr('value', s('{"beta":false}'))]),
  (ctx) => ctx.resource('aws_sns_topic', ctx.ident('alerts'), [attr('name', s(`${ctx.dnsName()}-alerts`)), attr('kms_master_key_id', s('alias/aws/sns'))]),
  (ctx) => block('data', ['aws_caller_identity', 'current'], []),
];

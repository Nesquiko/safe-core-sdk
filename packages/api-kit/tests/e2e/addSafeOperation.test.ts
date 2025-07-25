import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import Safe from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit/index'
import { getAddSafeOperationProps } from '@safe-global/api-kit/utils/safeOperation'
import { Safe4337Pack } from '@safe-global/relay-kit'
import { generateTransferCallData } from '@safe-global/relay-kit/test-utils'
import { getKits } from '../utils/setupKits'

chai.use(chaiAsPromised)

const SIGNER_PK = '0x83a415ca62e11f5fa5567e98450d0f82ae19ff36ef876c10a8d448c788a53676'
const SAFE_ADDRESS = '0x60C4Ab82D06Fd7dFE9517e17736C2Dcc77443EF0' // 1/2 Safe (v1.4.1) with signer above being an owner + 4337 module enabled
const PAYMASTER_TOKEN_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
const BUNDLER_URL = 'https://api.pimlico.io/v2/sepolia/rpc?apikey=pim_Vjs7ohRqWdvsjUegngf9Bg'

let safeApiKit: SafeApiKit
let protocolKit: Safe
let safe4337Pack: Safe4337Pack

describe('addSafeOperation', () => {
  const transferUSDC = {
    to: PAYMASTER_TOKEN_ADDRESS,
    data: generateTransferCallData(SAFE_ADDRESS, 100_000n),
    value: '0',
    operation: 0
  }

  before(async () => {
    ;({ safeApiKit, protocolKit } = await getKits({
      safeAddress: SAFE_ADDRESS,
      signer: SIGNER_PK
    }))

    safe4337Pack = await Safe4337Pack.init({
      provider: protocolKit.getSafeProvider().provider,
      signer: protocolKit.getSafeProvider().signer,
      options: { safeAddress: SAFE_ADDRESS },
      bundlerUrl: BUNDLER_URL
    })
  })

  describe('should fail', () => {
    it('if safeAddress is empty', async () => {
      const safeOperation = await safe4337Pack.createTransaction({ transactions: [transferUSDC] })
      const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)
      const addSafeOperationProps = await getAddSafeOperationProps(signedSafeOperation)

      await chai
        .expect(
          safeApiKit.addSafeOperation({
            ...addSafeOperationProps,
            safeAddress: ''
          })
        )
        .to.be.rejectedWith('Safe address must not be empty')
    })

    it('if safeAddress is invalid', async () => {
      const safeOperation = await safe4337Pack.createTransaction({ transactions: [transferUSDC] })
      const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)
      const addSafeOperationProps = await getAddSafeOperationProps(signedSafeOperation)

      await chai
        .expect(
          safeApiKit.addSafeOperation({
            ...addSafeOperationProps,
            safeAddress: '0x123'
          })
        )
        .to.be.rejectedWith('Invalid Safe address 0x123')
    })

    it('if moduleAddress is empty', async () => {
      const safeOperation = await safe4337Pack.createTransaction({ transactions: [transferUSDC] })
      const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)
      const addSafeOperationProps = await getAddSafeOperationProps(signedSafeOperation)

      await chai
        .expect(
          safeApiKit.addSafeOperation({
            ...addSafeOperationProps,
            moduleAddress: ''
          })
        )
        .to.be.rejectedWith('Module address must not be empty')
    })

    it('if moduleAddress is invalid', async () => {
      const safeOperation = await safe4337Pack.createTransaction({ transactions: [transferUSDC] })
      const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)
      const addSafeOperationProps = await getAddSafeOperationProps(signedSafeOperation)

      await chai
        .expect(
          safeApiKit.addSafeOperation({
            ...addSafeOperationProps,
            moduleAddress: '0x234'
          })
        )
        .to.be.rejectedWith('Invalid module address 0x234')
    })

    it('if the SafeOperation is not signed', async () => {
      const safeOperation = await safe4337Pack.createTransaction({ transactions: [transferUSDC] })
      const addSafeOperationProps = await getAddSafeOperationProps(safeOperation)

      await chai
        .expect(safeApiKit.addSafeOperation(addSafeOperationProps))
        .to.be.rejectedWith('Signature must not be empty')
    })
  })

  it('should add a new SafeOperation using an standard UserOperation and props', async () => {
    const safeOperation = await safe4337Pack.createTransaction({ transactions: [transferUSDC] })
    const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)
    const addSafeOperationProps = await getAddSafeOperationProps(signedSafeOperation)

    // Get the number of SafeOperations before adding a new one
    const safeOperationsBefore = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS)
    const initialNumSafeOperations = safeOperationsBefore.count

    await chai.expect(safeApiKit.addSafeOperation(addSafeOperationProps)).to.be.fulfilled

    const safeOperationsAfter = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS)
    chai.expect(safeOperationsAfter.count).to.equal(initialNumSafeOperations + 1)
  })

  it('should add a new SafeOperation using a SafeOperation object from the relay-kit', async () => {
    const safeOperation = await safe4337Pack.createTransaction({
      transactions: [transferUSDC, transferUSDC]
    })
    const signedSafeOperation = await safe4337Pack.signSafeOperation(safeOperation)
    // Get the number of SafeOperations before adding a new one
    const safeOperationsBefore = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS)
    const initialNumSafeOperations = safeOperationsBefore.count

    await chai.expect(safeApiKit.addSafeOperation(signedSafeOperation)).to.be.fulfilled

    const safeOperationsAfter = await safeApiKit.getSafeOperationsByAddress(SAFE_ADDRESS)
    chai.expect(safeOperationsAfter.count).to.equal(initialNumSafeOperations + 1)
  })
})

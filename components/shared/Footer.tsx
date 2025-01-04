import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

const Footer = () => {
  return (
    <motion.footer 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-t"
    >
      <div className="flex-center wrapper flex-between flex flex-col gap-4 p-5 text-center sm:flex-row">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href='/'>
            <Image 
              src="/assets/images/logo.svg"
              alt="logo"
              width={64}
              height={24}
            />
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {new Date().getFullYear()} 净土宗弥陀寺 (新加坡) Namo Amituofo Organization Ltd. All Rights reserved.
        </motion.p>
      </div>
    </motion.footer>
  )
}

export default Footer